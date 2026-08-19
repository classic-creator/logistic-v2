<?php
namespace App\Http\Controllers;

use App\Models\FinanceLedger;
use App\Http\Resources\FinanceLedgerResource;
use App\Http\Requests\StoreFinanceLedgerRequest;
use App\Http\Requests\UpdateFinanceLedgerRequest;
use Illuminate\Http\Request;

class FinanceLedgerController extends Controller
{
    private function calculateFields($data) {
        $data['diesel_expense'] = $data['diesel_expense'] ?? 0;
        $data['toll_expense'] = $data['toll_expense'] ?? 0;
        $data['driver_allowance'] = $data['driver_allowance'] ?? 0;
        $data['loading_charge'] = $data['loading_charge'] ?? 0;
        $data['unloading_charge'] = $data['unloading_charge'] ?? 0;
        $data['other_expenses'] = $data['other_expenses'] ?? 0;
        $data['payment_received'] = $data['payment_received'] ?? 0;

        $total_expenses = $data['diesel_expense'] + $data['toll_expense'] + $data['driver_allowance'] + 
                          $data['loading_charge'] + $data['unloading_charge'] + $data['other_expenses'];
        
        $net_profit = $data['trip_amount'] - $total_expenses;
        $pending_amount = $data['trip_amount'] - $data['payment_received'];
        $profit_margin = $data['trip_amount'] > 0 ? ($net_profit / $data['trip_amount']) * 100 : 0;

        $status = 'Pending';
        if ($pending_amount <= 0) $status = 'Paid';
        elseif ($data['payment_received'] > 0) $status = 'Partial';

        $data['total_expenses'] = $total_expenses;
        $data['net_profit'] = $net_profit;
        $data['pending_amount'] = $pending_amount;
        $data['profit_margin'] = round($profit_margin, 2);
        $data['status'] = $status;

        return $data;
    }

    public function index(Request $request)
    {
        $query = FinanceLedger::query()->with(['company', 'trip']);

        // 1. Tenant Company Scope (Security & Isolation)
        $user = $request->user();
        if ($user && !empty($user->company_id)) {
            $query->where('company_id', $user->company_id);
        } elseif ($request->filled('company_id')) {
            $query->where('company_id', $request->input('company_id'));
        }

        // 2. Status & Date Range Filtering
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('created_at', [$request->input('date_from'), $request->input('date_to')]);
        }

        // 3. Server-side Search
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhere('trip_id', 'like', "%{$search}%");
            });
        }

        // 4. Server-side Sorting
        $sortKey = $request->input('sort', 'created_at');
        $sortDir = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'status', 'trip_amount', 'net_profit', 'pending_amount', 'created_at'];
        if (in_array($sortKey, $allowedSorts)) {
            $query->orderBy($sortKey, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // 5. Capped Pagination (Max 100)
        $perPage = min(100, max(1, (int) $request->input('per_page', 25)));
        $data = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Financial ledger records fetched successfully',
            'data'    => FinanceLedgerResource::collection($data),
            'meta'    => [
                'current_page' => $data->currentPage(),
                'last_page'    => $data->lastPage(),
                'per_page'     => $data->perPage(),
                'total'        => $data->total(),
            ]
        ]);
    }

    public function store(StoreFinanceLedgerRequest $request)
    {
        $data = $this->calculateFields($request->validated());
        $finance = FinanceLedger::create($data);
        return response()->json([
            'success' => true,
            'message' => 'Finance ledger record created successfully',
            'data'    => new FinanceLedgerResource($finance)
        ], 201);
    }

    public function show(FinanceLedger $finance)
    {
        $finance->load('company', 'trip');
        return response()->json([
            'success' => true,
            'message' => 'Finance ledger details fetched successfully',
            'data'    => new FinanceLedgerResource($finance)
        ]);
    }

    public function update(UpdateFinanceLedgerRequest $request, FinanceLedger $finance)
    {
        $data = $this->calculateFields(array_merge($finance->toArray(), $request->validated()));
        $finance->update($data);
        return response()->json([
            'success' => true,
            'message' => 'Finance ledger record updated successfully',
            'data'    => new FinanceLedgerResource($finance)
        ]);
    }

    public function destroy(FinanceLedger $finance)
    {
        $finance->delete();
        return response()->json([
            'success' => true,
            'message' => 'Finance ledger record deleted successfully'
        ]);
    }
}
