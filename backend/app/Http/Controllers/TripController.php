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

        // 1. Tenant Company Scope (Security & Isolation)
        $user = $request->user();
        if ($user && !empty($user->company_id)) {
            $query->where('company_id', $user->company_id);
        } elseif ($request->filled('company_id')) {
            $query->where('company_id', $request->input('company_id'));
        }

        // 2. Driver & Vehicle Filters
        if ($request->filled('driver_id')) {
            $query->where('driver_id', $request->input('driver_id'));
        }
        if ($request->filled('vehicle_id')) {
            $query->where('vehicle_id', $request->input('vehicle_id'));
        }

        // 3. Status & Date Range Filtering
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('created_at', [$request->input('date_from'), $request->input('date_to')]);
        }

        // 4. Multi-field Server-side Search
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhere('pickup_location', 'like', "%{$search}%")
                  ->orWhere('destination', 'like', "%{$search}%")
                  ->orWhere('material', 'like', "%{$search}%")
                  ->orWhere('vehicle_number', 'like', "%{$search}%")
                  ->orWhere('driver_name', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        // 5. Server-side Sorting
        $sortKey = $request->input('sort', 'created_at');
        $sortDir = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'status', 'start_date', 'delivery_date', 'distance', 'created_at'];
        if (in_array($sortKey, $allowedSorts)) {
            $query->orderBy($sortKey, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // 6. Capped Pagination (Max 100)
        $perPage = min(100, max(1, (int) $request->input('per_page', 25)));
        $data = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Trips fetched successfully',
            'data'    => TripResource::collection($data),
            'meta'    => [
                'current_page' => $data->currentPage(),
                'last_page'    => $data->lastPage(),
                'per_page'     => $data->perPage(),
                'total'        => $data->total(),
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

        // Link original uploaded transport document if provided
        if ($request->filled('document_url') || $request->filled('document_path')) {
            $docUrl = $request->input('document_url') ?: asset('storage/' . $request->input('document_path'));
            $docType = $request->input('document_type', 'Transport Order / Consignment');
            $trip->documents()->create([
                'document_type' => $docType,
                'document_url'  => $docUrl,
            ]);
        }

        event(new \App\Events\Domain\TripCreatedEvent($trip, auth()->id()));

        return response()->json([
            'success' => true,
            'message' => 'Trip created successfully',
            'data'    => new TripResource($trip)
        ], 201);
    }

    public function show(Trip $trip)
    {
        $trip->load(['company', 'driver', 'vehicle', 'order', 'documents', 'financeLedger', 'fuelEntries']);
        return response()->json([
            'success' => true,
            'message' => 'Trip details fetched successfully',
            'data'    => new TripResource($trip)
        ]);
    }

    public function update(UpdateTripRequest $request, Trip $trip)
    {
        $oldStatus = $trip->status;
        $data = $request->validated();

        if ((isset($data['status']) && $data['status'] === 'Running' && $oldStatus === 'Assigned') 
            || (isset($data['start_odometer']) && !$trip->start_date)) {
            $data['start_date'] = now();
        }

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

        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            $newStatus = $data['status'];

            if ($trip->order) {
                $trip->order->update(['status' => $newStatus]);
            }

            if ($newStatus === 'Running') {
                if ($trip->vehicle) $trip->vehicle->update(['status' => 'Running']);
                if ($trip->driver) $trip->driver->update(['status' => 'On Trip']);
            } elseif ($newStatus === 'Completed') {
                if ($trip->vehicle) $trip->vehicle->update(['status' => 'Available']);
                if ($trip->driver) $trip->driver->update(['status' => 'Available']);

                $this->estimator->refreshTripActuals($trip);
                $this->finance->syncTripDieselExpense($trip);
            } elseif ($newStatus === 'Cancelled') {
                if ($trip->vehicle) $trip->vehicle->update(['status' => 'Available']);
                if ($trip->driver) $trip->driver->update(['status' => 'Available']);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Trip updated successfully',
            'data'    => new TripResource($trip)
        ]);
    }

    public function accept(Request $request, Trip $trip)
    {
        if ($trip->status !== 'Assigned') return response()->json(['success' => false, 'message' => 'Trip is not Assigned'], 400);
        $trip->update(['status' => 'Running']);
        return response()->json(['success' => true, 'message' => 'Trip accepted']);
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

        return response()->json(['success' => true, 'message' => 'Trip started']);
    }

    public function markDelivered(Request $request, Trip $trip)
    {
        $trip->update(['status' => 'Delivered']);
        return response()->json(['success' => true, 'message' => 'Trip marked delivered']);
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

        $this->estimator->refreshTripActuals($trip);
        $this->finance->syncTripDieselExpense($trip);
        
        event(new \App\Events\Domain\TripCompletedEvent($trip, auth()->id()));

        return response()->json(['success' => true, 'message' => 'Trip completed']);
    }
    
    public function cancel(Request $request, Trip $trip)
    {
        $trip->update(['status' => 'Cancelled']);
        if ($trip->order) $trip->order->update(['status' => 'Cancelled']);
        if ($trip->vehicle) $trip->vehicle->update(['status' => 'Available']);
        if ($trip->driver) $trip->driver->update(['status' => 'Available']);
        return response()->json(['success' => true, 'message' => 'Trip cancelled']);
    }
}
