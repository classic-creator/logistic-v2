<?php
namespace App\Http\Controllers;
use App\Models\Order;
use App\Models\Trip;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Http\Resources\OrderResource;
use App\Http\Resources\TripResource;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::query()->with(['company', 'trip']);
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        $perPage = $request->get('per_page', 15);
        $data = $query->paginate($perPage);
        return response()->json([
            'success' => true,
            'data' => OrderResource::collection($data),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'total' => $data->total(),
            ]
        ]);
    }

    public function store(StoreOrderRequest $request)
    {
        $data = $request->validated();
        $data['status'] = 'Pending';
        if (isset($data['vehicle_requirement'])) {
            $data['vehicle_type_required'] = $data['vehicle_requirement'];
            unset($data['vehicle_requirement']);
        }
        $order = Order::create($data);
        return response()->json([
            'success' => true,
            'message' => 'Created successfully',
            'data' => new OrderResource($order)
        ], 201);
    }

    public function show(Order $order)
    {
        $order->load('company', 'trip');
        return response()->json([
            'success' => true,
            'data' => new OrderResource($order)
        ]);
    }

    public function update(UpdateOrderRequest $request, Order $order)
    {
        $order->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Updated successfully',
            'data' => new OrderResource($order)
        ]);
    }

    public function destroy(Order $order)
    {
        $order->delete();
        return response()->json(['success' => true]);
    }

    public function assignDispatch(Request $request, Order $order)
    {
        $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'required|exists:drivers,id',
            'distance' => 'required|numeric',
            'estimated_duration' => 'required|numeric'
        ]);

        if ($order->status !== 'Pending') {
            return response()->json(['success' => false, 'message' => 'Order is not Pending'], 400);
        }

        $vehicle = Vehicle::find($request->vehicle_id);
        $driver = Driver::find($request->driver_id);

        if ($vehicle->status !== 'Available') return response()->json(['success' => false, 'message' => 'Vehicle not available'], 400);
        if ($driver->status !== 'Available') return response()->json(['success' => false, 'message' => 'Driver not available'], 400);

        // Create Trip
        $trip = Trip::create([
            'code' => 'TRP-' . time(),
            'order_id' => $order->id,
            'company_id' => $order->company_id,
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'pickup_location' => $order->pickup_location,
            'destination' => $order->destination,
            'pickup_latitude' => $order->pickup_latitude,
            'pickup_longitude' => $order->pickup_longitude,
            'destination_latitude' => $order->destination_latitude,
            'destination_longitude' => $order->destination_longitude,
            'material' => $order->material,
            'weight' => $order->weight,
            'distance' => $request->distance,
            'estimated_duration' => $request->estimated_duration,
            'status' => 'Assigned',
        ]);

        $order->update(['status' => 'Assigned']);
        $vehicle->update(['status' => 'Running']);
        $driver->update(['status' => 'On Trip']);

        return response()->json([
            'success' => true,
            'message' => 'Trip assigned successfully',
            'data' => new TripResource($trip)
        ]);
    }
}
