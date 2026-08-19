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

        // 1. Tenant Company Scope (Security & Isolation)
        $user = $request->user();
        if ($user && !empty($user->company_id)) {
            $query->where('id', $user->company_id);
        } elseif ($request->filled('company_id')) {
            $query->where('id', $request->input('company_id'));
        }

        // 2. Server-side Search
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%");
            });
        }

        // 3. Server-side Sorting
        $sortKey = $request->input('sort', 'created_at');
        $sortDir = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'name', 'created_at', 'city', 'email'];
        if (in_array($sortKey, $allowedSorts)) {
            $query->orderBy($sortKey, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // 4. Server-side Capped Pagination (Max 100)
        $perPage = min(100, max(1, (int) $request->input('per_page', 25)));
        $data = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Companies fetched successfully',
            'data'    => CompanyResource::collection($data),
            'meta'    => [
                'current_page' => $data->currentPage(),
                'last_page'    => $data->lastPage(),
                'per_page'     => $data->perPage(),
                'total'        => $data->total(),
            ]
        ]);
    }

    public function store(StoreCompanyRequest $request)
    {
        $company = Company::create($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Company created successfully',
            'data'    => new CompanyResource($company)
        ], 201);
    }

    public function show(Company $company)
    {
        return response()->json([
            'success' => true,
            'message' => 'Company details fetched successfully',
            'data'    => new CompanyResource($company)
        ]);
    }

    public function update(UpdateCompanyRequest $request, Company $company)
    {
        $company->update($request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Company updated successfully',
            'data'    => new CompanyResource($company)
        ]);
    }

    public function destroy(Company $company)
    {
        if (method_exists($company, 'trips') && $company->trips()->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete company because of linked trips'], 400);
        }
        if (method_exists($company, 'orders') && $company->orders()->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete company because of linked orders'], 400);
        }
        $company->delete();
        return response()->json([
            'success' => true,
            'message' => 'Company deleted successfully'
        ]);
    }
}
