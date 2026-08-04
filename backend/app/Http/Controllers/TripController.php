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
        $query = Trip::query()->with(['company', 'driver', 'vehicle', 'fuelEntries' => fn ($q) => $q->where('status', 'Approved')]);
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

        return response()->json([
            'success' => true,
            'data' => new TripResource($trip)
        ], 201);
    }

    public function show(Trip $trip)
    {
        $trip->load(['company', 'driver', 'vehicle', 'order', 'documents', 'financeLedger']);
        return response()->json([
            'success' => true,
            'data' => new TripResource($trip)
        ]);
    }

    public function update(UpdateTripRequest $request, Trip $trip)
    {
        $trip->update($request->validated());
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
        ]);
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
        $trip->vehicle->update(['status' => 'Available']);
        $trip->driver->update(['status' => 'Available']);

        // Recompute fuel actuals & mileage once the trip is closed
        $this->estimator->refreshTripActuals($trip);
        $this->finance->syncTripDieselExpense($trip);
        
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
