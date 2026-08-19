<?php
namespace App\Http\Controllers;

use App\Models\FuelEntry;
use App\Models\Trip;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Company;
use App\Services\AnomalyDetectionService;
use App\Services\FuelEstimationService;
use App\Services\FuelFinanceService;
use App\Http\Resources\FuelEntryResource;
use App\Http\Requests\StoreFuelEntryRequest;
use App\Http\Requests\UpdateFuelEntryRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FuelEntryController extends Controller
{
    protected AnomalyDetectionService $anomalies;
    protected FuelEstimationService $estimator;
    protected FuelFinanceService $finance;

    public function __construct(
        AnomalyDetectionService $anomalies,
        FuelEstimationService $estimator,
        FuelFinanceService $finance
    ) {
        $this->anomalies = $anomalies;
        $this->estimator = $estimator;
        $this->finance = $finance;
    }

    public function index(Request $request)
    {
        $query = FuelEntry::query()
            ->with(['trip', 'vehicle', 'driver', 'company']);

        // 1. Tenant Company Scope (Security & Isolation)
        $user = $request->user();
        if ($user && !empty($user->company_id)) {
            $query->where('company_id', $user->company_id);
        } elseif ($request->filled('company_id')) {
            $query->where('company_id', $request->input('company_id'));
        }

        foreach (['trip_id', 'vehicle_id', 'driver_id', 'status', 'fuel_type'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        if ($request->boolean('flagged')) {
            $query->where('is_flagged', true);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('filled_at', [$request->input('from'), $request->input('to')]);
        }

        // 2. Server-side Search
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('station_name', 'like', "%{$search}%")
                  ->orWhere('fuel_type', 'like', "%{$search}%")
                  ->orWhere('payment_method', 'like', "%{$search}%")
                  ->orWhere('remarks', 'like', "%{$search}%");
            });
        }

        // 3. Server-side Sorting
        $sortKey = $request->input('sort', 'filled_at');
        $sortDir = strtolower($request->input('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'filled_at', 'total_cost', 'quantity', 'status', 'created_at'];
        if (in_array($sortKey, $allowedSorts)) {
            $query->orderBy($sortKey, $sortDir);
        } else {
            $query->orderBy('filled_at', 'desc');
        }

        // 4. Server-side Capped Pagination (Max 100)
        $perPage = min(100, max(1, (int) $request->input('per_page', 25)));
        $data = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Fuel entries fetched successfully',
            'data'    => FuelEntryResource::collection($data),
            'meta'    => [
                'current_page' => $data->currentPage(),
                'last_page'    => $data->lastPage(),
                'per_page'     => $data->perPage(),
                'total'        => $data->total(),
            ]
        ]);
    }

    /**
     * Record a fuel fill. Auto-fills context the system already knows:
     * driver, vehicle, company, branch and timestamp are derived from the trip.
     */
    public function store(StoreFuelEntryRequest $request)
    {
        $data = $request->validated();

        $trip = null;
        if (!empty($data['trip_id'])) {
            $trip = Trip::with(['vehicle', 'driver', 'company'])->find($data['trip_id']);
            $data['vehicle_id'] = $data['vehicle_id'] ?? $trip?->vehicle_id;
            $data['driver_id'] = $data['driver_id'] ?? $trip?->driver_id;
            $data['company_id'] = $data['company_id'] ?? $trip?->company_id;
            $data['branch_id'] = $data['branch_id'] ?? $trip?->branch_id;
        }

        $vehicle = $data['vehicle_id'] ?? null ? Vehicle::find($data['vehicle_id']) : null;
        $data['fuel_type'] = $data['fuel_type'] ?? $vehicle?->fuel_type ?? 'Diesel';
        $data['filled_at'] = $data['filled_at'] ?? now()->toDateTimeString();
        $data['status'] = $data['status'] ?? FuelEntry::STATUS_PENDING;
        $data['total_cost'] = $this->computeTotalCost($data);

        $entry = DB::transaction(function () use ($data) {
            $entry = FuelEntry::create($data);
            $entry = $this->anomalies->inspect($entry);
            return $entry;
        });

        $this->afterEntryChange($entry);

        event(new \App\Events\Domain\FuelEntrySubmittedEvent($entry, auth()->id()));

        return response()->json([
            'success' => true,
            'message' => 'Fuel entry recorded successfully',
            'data' => new FuelEntryResource($entry->load(['trip', 'vehicle', 'driver', 'company']))
        ], 201);
    }

    public function show(Request $request, FuelEntry $fuelEntry)
    {
        $this->authorizeTenantAccess($request, $fuelEntry);
        $fuelEntry->load(['trip', 'vehicle', 'driver', 'company']);
        return response()->json([
            'success' => true,
            'data' => new FuelEntryResource($fuelEntry)
        ]);
    }

    public function update(UpdateFuelEntryRequest $request, FuelEntry $fuelEntry)
    {
        $this->authorizeTenantAccess($request, $fuelEntry);
        $data = $request->validated();

        if (array_key_exists('trip_id', $data) && $data['trip_id'] && $data['trip_id'] != $fuelEntry->trip_id) {
            $trip = Trip::find($data['trip_id']);
            $data['vehicle_id'] = $data['vehicle_id'] ?? $trip?->vehicle_id;
            $data['driver_id'] = $data['driver_id'] ?? $trip?->driver_id;
            $data['company_id'] = $data['company_id'] ?? $trip?->company_id;
        }

        $data['total_cost'] = $this->computeTotalCost(array_merge($fuelEntry->toArray(), $data));

        $oldStatus = $fuelEntry->status;
        $fuelEntry->update($data);
        $fuelEntry = $this->anomalies->inspect($fuelEntry);

        if ($oldStatus !== $fuelEntry->status) {
            $this->afterEntryChange($fuelEntry);
        }

        return response()->json([
            'success' => true,
            'data' => new FuelEntryResource($fuelEntry->load(['trip', 'vehicle', 'driver', 'company']))
        ]);
    }

    public function destroy(Request $request, FuelEntry $fuelEntry)
    {
        $this->authorizeTenantAccess($request, $fuelEntry);
        $trip = $fuelEntry->trip;
        $vehicle = $fuelEntry->vehicle;
        $fuelEntry->delete();

        if ($trip) {
            $this->estimator->refreshTripActuals($trip);
            $this->finance->syncTripDieselExpense($trip);
        }
        if ($vehicle) {
            $this->estimator->refreshVehicleMileage($vehicle);
        }

        return response()->json(['success' => true]);
    }

    public function approve(Request $request, FuelEntry $fuelEntry)
    {
        $this->authorizeTenantAccess($request, $fuelEntry);

        // Atomic approval & finance transaction
        $fuelEntry = DB::transaction(function () use ($request, $fuelEntry) {
            $fuelEntry->update([
                'status' => FuelEntry::STATUS_APPROVED,
                'approved_by' => $request->user()?->id,
                'approved_at' => now(),
            ]);
            $fuelEntry = $this->anomalies->inspect($fuelEntry);
            $this->afterEntryChange($fuelEntry);
            return $fuelEntry;
        });

        event(new \App\Events\Domain\FuelApprovedEvent($fuelEntry, auth()->id()));

        return response()->json([
            'success' => true,
            'message' => 'Fuel entry approved and synced to finance',
            'data' => new FuelEntryResource($fuelEntry->load(['trip', 'vehicle', 'driver', 'company']))
        ]);
    }

    public function reject(Request $request, FuelEntry $fuelEntry)
    {
        $fuelEntry->update([
            'status' => FuelEntry::STATUS_REJECTED,
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);
        $this->afterEntryChange($fuelEntry);

        return response()->json([
            'success' => true,
            'message' => 'Fuel entry rejected',
            'data' => new FuelEntryResource($fuelEntry->load(['trip', 'vehicle', 'driver', 'company']))
        ]);
    }

    /**
     * Re-run anomaly detection over flagged/pending entries (batch recalc).
     */
    public function rescan(FuelEntry $fuelEntry)
    {
        $fuelEntry = $this->anomalies->inspect($fuelEntry);
        return response()->json([
            'success' => true,
            'data' => new FuelEntryResource($fuelEntry->load(['trip', 'vehicle', 'driver', 'company']))
        ]);
    }

    protected function computeTotalCost(array $data): float
    {
        if (isset($data['total_cost']) && (float) $data['total_cost'] > 0) {
            return round((float) $data['total_cost'], 2);
        }
        $qty = (float) ($data['quantity'] ?? 0);
        $price = (float) ($data['unit_price'] ?? 0);
        return round($qty * $price, 2);
    }

    /**
     * Reconcile everything that depends on a fuel entry: trip actuals,
     * vehicle rolling mileage and the finance ledger.
     */
    protected function afterEntryChange(FuelEntry $entry): void
    {
        $trip = $entry->trip_id ? Trip::find($entry->trip_id) : null;
        if ($trip) {
            $this->estimator->refreshTripActuals($trip);
            $this->finance->syncTripDieselExpense($trip);
        }
        if ($entry->vehicle_id) {
            $this->estimator->refreshVehicleMileage($entry->vehicle);
        }
    }

    /**
     * Security & Tenant Scoping Guard (IDOR Protection)
     */
    protected function authorizeTenantAccess(Request $request, FuelEntry $fuelEntry): void
    {
        $user = $request->user();
        if ($user && !empty($user->company_id) && $fuelEntry->company_id && $fuelEntry->company_id != $user->company_id) {
            abort(403, 'Unauthorized access to fuel entry for another company tenant');
        }
    }
}
