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

        // 1. Tenant Company Scope (Security & Isolation)
        $user = $request->user();
        if ($user && !empty($user->company_id)) {
            $query->where('company_id', $user->company_id);
        } elseif ($request->filled('company_id')) {
            $query->where('company_id', $request->input('company_id'));
        }

        // 2. Status & Type Filtering
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        // 3. Server-side Search
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%")
                  ->orWhere('fuel_type', 'like', "%{$search}%");
            });
        }

        // 4. Server-side Sorting
        $sortKey = $request->input('sort', 'created_at');
        $sortDir = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'number', 'status', 'type', 'created_at', 'last_odometer'];
        if (in_array($sortKey, $allowedSorts)) {
            $query->orderBy($sortKey, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // 5. Server-side Capped Pagination (Max 100)
        $perPage = min(100, max(1, (int) $request->input('per_page', 25)));
        $data = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Vehicles fetched successfully',
            'data'    => VehicleResource::collection($data),
            'meta'    => [
                'current_page' => $data->currentPage(),
                'last_page'    => $data->lastPage(),
                'per_page'     => $data->perPage(),
                'total'        => $data->total(),
            ]
        ]);
    }

    public function store(StoreVehicleRequest $request)
    {
        $vehicle = Vehicle::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Vehicle created successfully',
            'data'    => new VehicleResource($vehicle)
        ], 201);
    }

    public function show(Vehicle $vehicle)
    {
        return response()->json([
            'success' => true,
            'message' => 'Vehicle details fetched successfully',
            'data'    => new VehicleResource($vehicle)
        ]);
    }

    public function update(UpdateVehicleRequest $request, Vehicle $vehicle)
    {
        $vehicle->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Vehicle updated successfully',
            'data'    => new VehicleResource($vehicle)
        ]);
    }

    public function destroy(Vehicle $vehicle)
    {
        if (method_exists($vehicle, 'trips') && $vehicle->trips()->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete vehicle because of linked trips'], 400);
        }
        if (method_exists($vehicle, 'orders') && $vehicle->orders()->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete vehicle because of linked orders'], 400);
        }
        $vehicle->delete();
        return response()->json([
            'success' => true,
            'message' => 'Vehicle deleted successfully'
        ]);
    }
}
