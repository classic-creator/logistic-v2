<?php
namespace App\Http\Controllers;
use App\Models\Company;
use App\Http\Resources\CompanyResource;
use App\Http\Requests\StoreCompanyRequest;
use App\Http\Requests\UpdateCompanyRequest;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $query = Company::query();
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }
        $perPage = $request->get('per_page', 15);
        $data = $query->paginate($perPage);
        return response()->json([
            'success' => true,
            'message' => 'Fetched successfully',
            'data' => CompanyResource::collection($data),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
            ]
        ]);
    }

    public function store(StoreCompanyRequest $request)
    {
        $company = Company::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Created successfully',
            'data' => new CompanyResource($company)
        ], 201);
    }

    public function show(Company $company)
    {
        return response()->json([
            'success' => true,
            'message' => 'Fetched successfully',
            'data' => new CompanyResource($company)
        ]);
    }

    public function update(UpdateCompanyRequest $request, Company $company)
    {
        $company->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Updated successfully',
            'data' => new CompanyResource($company)
        ]);
    }

    public function destroy(Company $company)
    {
        // check rules before delete
        if (method_exists($company, 'trips') && $company->trips()->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete because of linked trips'], 400);
        }
        if (method_exists($company, 'orders') && $company->orders()->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete because of linked orders'], 400);
        }
        $company->delete();
        return response()->json([
            'success' => true,
            'message' => 'Deleted successfully'
        ]);
    }
}
