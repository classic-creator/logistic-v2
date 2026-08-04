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
        $query = FinanceLedger::query()->with('company');
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        $perPage = $request->get('per_page', 15);
        $data = $query->paginate($perPage);
        return response()->json([
            'success' => true,
            'data' => FinanceLedgerResource::collection($data),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'total' => $data->total(),
            ]
        ]);
    }

    public function store(StoreFinanceLedgerRequest $request)
    {
        $data = $this->calculateFields($request->validated());
        $finance = FinanceLedger::create($data);
        return response()->json([
            'success' => true,
            'message' => 'Created successfully',
            'data' => new FinanceLedgerResource($finance)
        ], 201);
    }

    public function show(FinanceLedger $finance)
    {
        $finance->load('company', 'trip');
        return response()->json([
            'success' => true,
            'data' => new FinanceLedgerResource($finance)
        ]);
    }

    public function update(UpdateFinanceLedgerRequest $request, FinanceLedger $finance)
    {
        $data = $this->calculateFields(array_merge($finance->toArray(), $request->validated()));
        $finance->update($data);
        return response()->json([
            'success' => true,
            'message' => 'Updated successfully',
            'data' => new FinanceLedgerResource($finance)
        ]);
    }

    public function destroy(FinanceLedger $finance)
    {
        $finance->delete();
        return response()->json(['success' => true]);
    }
}
