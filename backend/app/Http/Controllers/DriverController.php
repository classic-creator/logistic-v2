<?php
namespace App\Http\Controllers;

use App\Models\Driver;
use App\Http\Resources\DriverResource;
use App\Http\Requests\StoreDriverRequest;
use App\Http\Requests\UpdateDriverRequest;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function index(Request $request)
    {
        $query = Driver::query();

        // 1. Tenant Company Scope (Security & Isolation)
        $user = $request->user();
        if ($user && !empty($user->company_id)) {
            $query->where('company_id', $user->company_id);
        } elseif ($request->filled('company_id')) {
            $query->where('company_id', $request->input('company_id'));
        }

        // 2. Status Filtering
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // 3. Server-side Search
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('license_number', 'like', "%{$search}%")
                  ->orWhere('assigned_vehicle', 'like', "%{$search}%");
            });
        }

        // 4. Server-side Sorting
        $sortKey = $request->input('sort', 'created_at');
        $sortDir = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'name', 'status', 'created_at'];
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
            'message' => 'Drivers fetched successfully',
            'data'    => DriverResource::collection($data),
            'meta'    => [
                'current_page' => $data->currentPage(),
                'last_page'    => $data->lastPage(),
                'per_page'     => $data->perPage(),
                'total'        => $data->total(),
            ]
        ]);
    }

    public function store(StoreDriverRequest $request)
    {
        $driver = Driver::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Driver created successfully',
            'data'    => new DriverResource($driver)
        ], 201);
    }

    public function show(Driver $driver)
    {
        return response()->json([
            'success' => true,
            'message' => 'Driver details fetched successfully',
            'data'    => new DriverResource($driver)
        ]);
    }

    public function update(UpdateDriverRequest $request, Driver $driver)
    {
        $driver->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Driver updated successfully',
            'data'    => new DriverResource($driver)
        ]);
    }

    public function destroy(Driver $driver)
    {
        if (method_exists($driver, 'trips') && $driver->trips()->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete driver because of linked trips'], 400);
        }
        if (method_exists($driver, 'orders') && $driver->orders()->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete driver because of linked orders'], 400);
        }
        $driver->delete();
        return response()->json([
            'success' => true,
            'message' => 'Driver deleted successfully'
        ]);
    }
}
