<?php
namespace App\Http\Controllers;
use App\Models\Vehicle;
use App\Http\Resources\VehicleResource;
use App\Http\Requests\StoreVehicleRequest;
use App\Http\Requests\UpdateVehicleRequest;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        $query = Vehicle::query();
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('number', 'like', "%{$search}%");
        }
        $perPage = $request->get('per_page', 15);
        $data = $query->paginate($perPage);
        return response()->json([
            'success' => true,
            'message' => 'Fetched successfully',
            'data' => VehicleResource::collection($data),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
            ]
        ]);
    }

    public function store(StoreVehicleRequest $request)
    {
        $vehicle = Vehicle::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Created successfully',
            'data' => new VehicleResource($vehicle)
        ], 201);
    }

    public function show(Vehicle $vehicle)
    {
        return response()->json([
            'success' => true,
            'message' => 'Fetched successfully',
            'data' => new VehicleResource($vehicle)
        ]);
    }

    public function update(UpdateVehicleRequest $request, Vehicle $vehicle)
    {
        $vehicle->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Updated successfully',
            'data' => new VehicleResource($vehicle)
        ]);
    }

    public function destroy(Vehicle $vehicle)
    {
        // check rules before delete
        if (method_exists($vehicle, 'trips') && $vehicle->trips()->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete because of linked trips'], 400);
        }
        if (method_exists($vehicle, 'orders') && $vehicle->orders()->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete because of linked orders'], 400);
        }
        $vehicle->delete();
        return response()->json([
            'success' => true,
            'message' => 'Deleted successfully'
        ]);
    }
}
