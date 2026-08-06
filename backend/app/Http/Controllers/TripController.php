<?php
namespace App\Http\Controllers;
use App\Models\Trip;
use App\Models\TripDocument;
use App\Services\FuelEstimationService;
use App\Services\FuelFinanceService;
use App\Http\Resources\TripResource;
use App\Http\Requests\StoreTripRequest;
use App\Http\Requests\UpdateTripRequest;
use Illuminate\Http\Request;

class TripController extends Controller
{
    protected FuelEstimationService $estimator;
    protected FuelFinanceService $finance;

    public function __construct(FuelEstimationService $estimator, FuelFinanceService $finance)
    {
        $this->estimator = $estimator;
        $this->finance = $finance;
    }

    public function index(Request $request)
    {
        $query = Trip::query()->with(['company', 'driver', 'vehicle', 'fuelEntries']);
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        $perPage = $request->get('per_page', 15);
        $data = $query->paginate($perPage);
        return response()->json([
            'success' => true,
            'data' => TripResource::collection($data),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'total' => $data->total(),
            ]
        ]);
    }

    public function store(StoreTripRequest $request)
    {
        $data = $request->validated();
        $data['status'] = 'Assigned'; // Force initial status
        $trip = Trip::create($data);

        // Update related entities
        if ($trip->order_id) {
            \App\Models\Order::where('id', $trip->order_id)->update(['status' => 'Assigned']);
        }
        if ($trip->vehicle_id) {
            \App\Models\Vehicle::where('id', $trip->vehicle_id)->update(['status' => 'Running']);
        }
        if ($trip->driver_id) {
            \App\Models\Driver::where('id', $trip->driver_id)->update(['status' => 'On Trip']);
        }

        // Fuel Intelligence: run the estimation engine automatically
        $trip = $this->estimator->estimateAndPersist($trip);
        $this->finance->createLedgerForTrip($trip);

        event(new \App\Events\Domain\TripCreatedEvent($trip, auth()->id()));

        return response()->json([
            'success' => true,
            'data' => new TripResource($trip)
        ], 201);
    }

    public function show(Trip $trip)
    {
        $trip->load(['company', 'driver', 'vehicle', 'order', 'documents', 'financeLedger', 'fuelEntries']);
        return response()->json([
            'success' => true,
            'data' => new TripResource($trip)
        ]);
    }

    public function update(UpdateTripRequest $request, Trip $trip)
    {
        $oldStatus = $trip->status;
        $data = $request->validated();

        // If status changes to Running or start_odometer is provided, set start_date
        if ((isset($data['status']) && $data['status'] === 'Running' && $oldStatus === 'Assigned') 
            || (isset($data['start_odometer']) && !$trip->start_date)) {
            $data['start_date'] = now();
        }

        // If status changes to Completed, set end_date
        if (isset($data['status']) && $data['status'] === 'Completed' && $oldStatus !== 'Completed') {
            $data['end_date'] = now();
            $data['delivery_date'] = now()->format('Y-m-d');
        }

        $pickupPhoto = $data['pickup_photo'] ?? null;
        $deliveryPhoto = $data['delivery_photo'] ?? null;
        $podPhoto = $data['pod_photo'] ?? null;

        unset($data['pickup_photo'], $data['delivery_photo'], $data['pod_photo']);

        $trip->update($data);

        if ($pickupPhoto) {
            $trip->documents()->updateOrCreate(
                ['document_type' => 'Pickup Inspection'],
                ['document_url' => $pickupPhoto]
            );
        }

        if ($deliveryPhoto) {
            $trip->documents()->updateOrCreate(
                ['document_type' => 'Delivery Cargo'],
                ['document_url' => $deliveryPhoto]
            );
        }

        if ($podPhoto) {
            $trip->documents()->updateOrCreate(
                ['document_type' => 'Proof of Delivery (POD)'],
                ['document_url' => $podPhoto]
            );
        }

        // Check if status changed
        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            $newStatus = $data['status'];

            // Sync status to the linked order if it exists
            if ($trip->order) {
                $trip->order->update(['status' => $newStatus]);
            }

            // Sync statuses to vehicle & driver
            if ($newStatus === 'Running') {
                if ($trip->vehicle) $trip->vehicle->update(['status' => 'Running']);
                if ($trip->driver) $trip->driver->update(['status' => 'On Trip']);
            } elseif ($newStatus === 'Completed') {
                if ($trip->vehicle) $trip->vehicle->update(['status' => 'Available']);
                if ($trip->driver) $trip->driver->update(['status' => 'Available']);

                // Recompute fuel actuals & mileage once the trip is completed
                $this->estimator->refreshTripActuals($trip);
                $this->finance->syncTripDieselExpense($trip);
            } elseif ($newStatus === 'Cancelled') {
                if ($trip->vehicle) $trip->vehicle->update(['status' => 'Available']);
                if ($trip->driver) $trip->driver->update(['status' => 'Available']);
            }
        }

        return response()->json(['success' => true, 'data' => new TripResource($trip)]);
    }

    public function accept(Request $request, Trip $trip)
    {
        if ($trip->status !== 'Assigned') return response()->json(['success' => false], 400);
        $trip->update(['status' => 'Running']);
        return response()->json(['success' => true]);
    }

    public function start(Request $request, Trip $trip)
    {
        $request->validate(['start_odometer' => 'required|numeric']);
        $trip->update([
            'start_odometer' => $request->start_odometer,
            'remarks' => $request->remarks,
            'status' => 'Running',
        ]);

        event(new \App\Events\Domain\TripStartedEvent($trip, auth()->id()));

        return response()->json(['success' => true]);
    }

    public function markDelivered(Request $request, Trip $trip)
    {
        $trip->update(['status' => 'Delivered']);
        return response()->json(['success' => true]);
    }

    public function complete(Request $request, Trip $trip)
    {
        $request->validate(['end_odometer' => 'required|numeric|gt:' . $trip->start_odometer]);
        
        $trip->update([
            'status' => 'Completed',
            'end_odometer' => $request->end_odometer,
            'delivery_date' => now(),
            'remarks' => $request->remarks
        ]);
        
        if ($trip->order) {
            $trip->order->update(['status' => 'Completed']);
        }
        if ($trip->vehicle) $trip->vehicle->update(['status' => 'Available']);
        if ($trip->driver) $trip->driver->update(['status' => 'Available']);

        // Recompute fuel actuals & mileage once the trip is closed
        $this->estimator->refreshTripActuals($trip);
        $this->finance->syncTripDieselExpense($trip);
        
        event(new \App\Events\Domain\TripCompletedEvent($trip, auth()->id()));

        return response()->json(['success' => true]);
    }
    
    public function cancel(Request $request, Trip $trip)
    {
        $trip->update(['status' => 'Cancelled']);
        if ($trip->order) $trip->order->update(['status' => 'Cancelled']);
        $trip->vehicle->update(['status' => 'Available']);
        $trip->driver->update(['status' => 'Available']);
        return response()->json(['success' => true]);
    }
}
