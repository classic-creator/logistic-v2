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
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }
        $perPage = $request->get('per_page', 15);
        $data = $query->paginate($perPage);
        return response()->json([
            'success' => true,
            'message' => 'Fetched successfully',
            'data' => DriverResource::collection($data),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
            ]
        ]);
    }

    public function store(StoreDriverRequest $request)
    {
        $driver = Driver::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Created successfully',
            'data' => new DriverResource($driver)
        ], 201);
    }

    public function show(Driver $driver)
    {
        return response()->json([
            'success' => true,
            'message' => 'Fetched successfully',
            'data' => new DriverResource($driver)
        ]);
    }

    public function update(UpdateDriverRequest $request, Driver $driver)
    {
        $driver->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Updated successfully',
            'data' => new DriverResource($driver)
        ]);
    }

    public function destroy(Driver $driver)
    {
        // check rules before delete
        if (method_exists($driver, 'trips') && $driver->trips()->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete because of linked trips'], 400);
        }
        if (method_exists($driver, 'orders') && $driver->orders()->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete because of linked orders'], 400);
        }
        $driver->delete();
        return response()->json([
            'success' => true,
            'message' => 'Deleted successfully'
        ]);
    }
}
