<?php
namespace App\Http\Controllers;

use App\Models\FuelEntry;
use App\Models\FuelPrice;
use App\Models\Trip;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Services\FuelEstimationService;
use App\Http\Resources\FuelEntryResource;
use App\Http\Resources\TripResource;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Fuel Intelligence endpoints: dashboard widgets, analytics, estimates and
 * per-trip estimation vs actual variance analysis.
 */
class FuelIntelligenceController extends Controller
{
    protected FuelEstimationService $estimator;

    public function __construct(FuelEstimationService $estimator)
    {
        $this->estimator = $estimator;
    }

    /**
     * Live estimate preview used before a trip is created.
     * Accepts a trip_id (already created) or raw inputs {vehicle_id, distance, pickup_location}.
     */
    public function estimatePreview(Request $request)
    {
        $request->validate([
            'trip_id' => 'required_without_all:vehicle_id,distance|exists:trips,id',
            'vehicle_id' => 'required_without:trip_id|exists:vehicles,id',
            'distance' => 'required_without:trip_id|numeric|min:0',
            'pickup_location' => 'nullable|string',
            'destination' => 'nullable|string',
        ]);

        if ($request->has('trip_id')) {
            $trip = Trip::with('vehicle')->find($request->trip_id);
        } else {
            $trip = new Trip([
                'vehicle_id' => $request->vehicle_id,
                'distance' => $request->distance,
                'pickup_location' => $request->pickup_location,
                'destination' => $request->destination,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $this->estimator->estimate($trip, $trip->vehicle),
        ]);
    }

    /**
     * Estimation vs actual comparison for one trip.
     */
    public function tripBreakdown(Trip $trip)
    {
        $trip->load('fuelEntries', 'vehicle');

        if (!$trip->estimated_fuel_liters) {
            $this->estimator->estimateAndPersist($trip);
        }

        $approved = $trip->fuelEntries->where('status', FuelEntry::STATUS_APPROVED);
        $actualLiters = (float) $approved->sum('quantity');
        $actualCost = (float) $approved->sum('total_cost');
        $estLiters = (float) $trip->estimated_fuel_liters;
        $estCost = (float) $trip->estimated_fuel_cost;
        $actualDistance = $trip->actualDistance();

        $litersVariance = $estLiters > 0 ? (($actualLiters - $estLiters) / $estLiters) * 100 : 0;
        $costVariance = $estCost > 0 ? (($actualCost - $estCost) / $estCost) * 100 : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'trip' => new TripResource($trip),
                'estimate' => [
                    'distance' => (float) $trip->estimated_distance,
                    'fuel_liters' => $estLiters,
                    'fuel_cost' => $estCost,
                    'mileage' => (float) $trip->estimated_mileage,
                    'price_per_liter' => (float) $trip->fuel_price_per_liter,
                ],
                'actual' => [
                    'distance' => round($actualDistance, 2),
                    'fuel_liters' => round($actualLiters, 2),
                    'fuel_cost' => round($actualCost, 2),
                    'mileage' => $trip->actualMileage(),
                    'avg_price_per_liter' => $actualLiters > 0 ? round($actualCost / $actualLiters, 2) : 0,
                ],
                'variance' => [
                    'distance' => round($actualDistance - (float) $trip->estimated_distance, 2),
                    'fuel_liters' => round($actualLiters - $estLiters, 2),
                    'fuel_cost' => round($actualCost - $estCost, 2),
                    'fuel_liters_pct' => round($litersVariance, 2),
                    'fuel_cost_pct' => round($costVariance, 2),
                    'status' => $trip->fuelVarianceStatus(),
                ],
                'entries' => FuelEntryResource::collection($trip->fuelEntries->load(['trip', 'vehicle', 'driver', 'company'])),
            ],
        ]);
    }

    /**
     * Fuel dashboard widgets.
     */
    public function dashboard(Request $request)
    {
        $today = Carbon::today();
        $monthStart = $today->copy()->startOfMonth();

        $todayEntries = FuelEntry::where('status', FuelEntry::STATUS_APPROVED)
            ->whereDate('filled_at', $today)->get();
        $monthEntries = FuelEntry::where('status', FuelEntry::STATUS_APPROVED)
            ->whereDate('filled_at', '>=', $monthStart)->get();
        $allEntries = FuelEntry::where('status', FuelEntry::STATUS_APPROVED)->get();

        $todayTrips = Trip::whereDate('start_date', $today)->get();

        $todayActualCost = (float) $todayEntries->sum('total_cost');
        $todayEstimate = (float) $todayTrips->sum('estimated_fuel_cost');
        $monthActualCost = (float) $monthEntries->sum('total_cost');

        // Cost per km from approved entries vs completed-trip distance
        $completedTrips = Trip::where('status', 'Completed')->get();
        $totalDistance = (float) $completedTrips->sum(fn ($t) => $t->actualDistance());
        $totalLiters = (float) $allEntries->sum('quantity');
        $totalCost = (float) $allEntries->sum('total_cost');

        $mileages = [];
        foreach ($completedTrips as $trip) {
            $m = $trip->actualMileage();
            if ($m > 0) $mileages[] = $m;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'today' => [
                    'estimated_fuel_cost' => round($todayEstimate, 2),
                    'actual_fuel_cost' => round($todayActualCost, 2),
                    'difference' => round($todayActualCost - $todayEstimate, 2),
                    'entries' => $todayEntries->count(),
                    'trips' => $todayTrips->count(),
                ],
                'month' => [
                    'actual_fuel_cost' => round($monthActualCost, 2),
                    'entries' => $monthEntries->count(),
                ],
                'overall' => [
                    'total_fuel_cost' => round($totalCost, 2),
                    'total_liters' => round($totalLiters, 2),
                    'total_distance' => round($totalDistance, 2),
                    'avg_cost_per_km' => $totalDistance > 0 ? round($totalCost / $totalDistance, 2) : 0,
                    'avg_mileage' => count($mileages) ? round(array_sum($mileages) / count($mileages), 2) : 0,
                    'avg_cost_per_liter' => $totalLiters > 0 ? round($totalCost / $totalLiters, 2) : 0,
                ],
                'by_vehicle' => $this->groupedCost($allEntries, 'vehicle_id'),
                'by_driver' => $this->groupedCost($allEntries, 'driver_id'),
                'by_company' => $this->groupedCost($allEntries, 'company_id'),
                'by_route' => $this->routeCost($completedTrips),
            ],
        ]);
    }

    /**
     * Deep analytics by dimension and period.
     */
    public function analytics(Request $request)
    {
        $dimension = $request->get('dimension', 'vehicle');
        $fuelType = $request->get('fuel_type');
        $from = $request->get('from');
        $to = $request->get('to');

        $query = FuelEntry::query()
            ->where('status', FuelEntry::STATUS_APPROVED)
            ->with(['vehicle', 'driver', 'company', 'trip']);

        if ($fuelType) $query->where('fuel_type', $fuelType);
        if ($from && $to) $query->whereBetween('filled_at', [$from, $to]);

        $entries = $query->get();

        $result = match ($dimension) {
            'driver' => $this->driverStats($entries),
            'route' => $this->routeStats($entries),
            'company' => $this->companyStats($entries),
            'month' => $this->monthlySeries($entries),
            'year' => $this->yearlySeries($entries),
            'anomalies' => $this->anomalyStats(),
            default => $this->vehicleStats($entries),
        };

        return response()->json(['success' => true, 'data' => $result]);
    }

    /**
     * Driver/Vehicle/Company/Route performance profiles used by drill-down views.
     */
    public function vehiclePerformance(Vehicle $vehicle, Request $request)
    {
        $entries = $this->entriesFor($request)
            ->where('vehicle_id', $vehicle->id)->get();

        $stats = $this->statsFor($entries, $vehicle, $vehicle->driver_id ?? null);

        return response()->json(['success' => true, 'data' => $stats]);
    }

    public function driverPerformance(Driver $driver, Request $request)
    {
        $entries = $this->entriesFor($request)->where('driver_id', $driver->id)->get();

        $liters = (float) $entries->sum('quantity');
        $cost = (float) $entries->sum('total_cost');
        $distance = (float) $entries->sum(fn ($e) => $e->trip?->actualDistance());
        $revenue = (float) $entries->sum(fn ($e) => $e->trip?->financeLedger?->trip_amount);

        return response()->json(['success' => true, 'data' => [
            'id' => $driver->id,
            'driver_name' => $driver->name,
            'entries' => $entries->count(),
            'liters' => round($liters, 2),
            'cost' => round($cost, 2),
            'distance' => round($distance, 2),
            'avg_mileage' => $liters > 0 ? round($distance / $liters, 2) : 0,
            'cost_per_km' => $distance > 0 ? round($cost / $distance, 2) : 0,
            'fuel_to_revenue' => $revenue > 0 ? round($cost / $revenue, 4) : null,
        ]]);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    protected function entriesFor(Request $request)
    {
        $q = FuelEntry::query()->where('status', FuelEntry::STATUS_APPROVED);
        if ($request->has('from') && $request->has('to')) {
            $q->whereBetween('filled_at', [$request->input('from'), $request->input('to')]);
        }
        return $q;
    }

    protected function groupedCost($entries, $key)
    {
        $out = [];
        foreach ($entries as $e) {
            $id = $e->{$key};
            if (!$id) continue;
            if (!isset($out[$id])) $out[$id] = ['id' => $id, 'cost' => 0, 'liters' => 0];
            $out[$id]['cost'] += (float) $e->total_cost;
            $out[$id]['liters'] += (float) $e->quantity;
        }
        foreach ($out as $k => $v) {
            $out[$k]['cost'] = round($v['cost'], 2);
            $out[$k]['liters'] = round($v['liters'], 2);
        }
        return array_values($out);
    }

    protected function routeCost($trips)
    {
        $out = [];
        foreach ($trips as $trip) {
            $route = ($trip->pickup_location ?? '?') . ' → ' . ($trip->destination ?? '?');
            if (!isset($out[$route])) $out[$route] = ['route' => $route, 'cost' => 0, 'liters' => 0, 'distance' => 0, 'trips' => 0];
            $out[$route]['cost'] += $trip->actualFuelCost();
            $out[$route]['liters'] += $trip->actualFuelLiters();
            $out[$route]['distance'] += $trip->actualDistance();
            $out[$route]['trips'] += 1;
        }
        foreach ($out as $k => $v) {
            $out[$k]['cost'] = round($v['cost'], 2);
            $out[$k]['liters'] = round($v['liters'], 2);
            $out[$k]['distance'] = round($v['distance'], 2);
            $out[$k]['cost_per_km'] = $v['distance'] > 0 ? round($v['cost'] / $v['distance'], 2) : 0;
            $out[$k]['mileage'] = $v['liters'] > 0 ? round($v['distance'] / $v['liters'], 2) : 0;
        }
        return array_values($out);
    }

    protected function vehicleStats($entries)
    {
        $groups = $entries->groupBy('vehicle_id');
        $out = [];
        foreach ($groups as $vid => $list) {
            $vehicle = $list->first()->vehicle;
            if (!$vehicle) continue;
            $dist = $this->distanceForVehicle($vehicle);
            $stats = $this->statsFor($list, $vehicle, null, $dist);
            $stats['id'] = $vid;
            $stats['vehicle_number'] = $vehicle->number;
            $out[] = $stats;
        }
        return $out;
    }

    protected function driverStats($entries)
    {
        $groups = $entries->groupBy('driver_id');
        $out = [];
        foreach ($groups as $did => $list) {
            $driver = $list->first()->driver;
            if (!$driver) continue;
            $liters = (float) $list->sum('quantity');
            $cost = (float) $list->sum('total_cost');
            $distance = (float) $list->sum(fn ($e) => $e->trip?->actualDistance());
            $revenue = (float) $list->sum(fn ($e) => $e->trip?->financeLedger?->trip_amount);
            $out[] = [
                'id' => $did,
                'driver_name' => $driver->name,
                'entries' => $list->count(),
                'liters' => round($liters, 2),
                'cost' => round($cost, 2),
                'distance' => round($distance, 2),
                'avg_mileage' => $liters > 0 ? round($distance / $liters, 2) : 0,
                'cost_per_km' => $distance > 0 ? round($cost / $distance, 2) : 0,
                'fuel_to_revenue' => $revenue > 0 ? round($cost / $revenue, 4) : null,
            ];
        }
        return $out;
    }

    protected function routeStats($entries)
    {
        $map = [];
        foreach ($entries as $e) {
            $trip = $e->trip;
            if (!$trip) continue;
            $route = ($trip->pickup_location ?? '?') . ' → ' . ($trip->destination ?? '?');
            if (!isset($map[$route])) $map[$route] = ['route' => $route, 'entries' => 0, 'liters' => 0, 'cost' => 0, 'distance' => 0, 'trips' => []];
            $map[$route]['entries']++;
            $map[$route]['liters'] += (float) $e->quantity;
            $map[$route]['cost'] += (float) $e->total_cost;
            $map[$route]['distance'] += $trip->actualDistance();
            $map[$route]['trips'][] = $trip->id;
        }
        $out = [];
        foreach ($map as $route => $m) {
            $out[] = [
                'route' => $route,
                'entries' => $m['entries'],
                'liters' => round($m['liters'], 2),
                'cost' => round($m['cost'], 2),
                'distance' => round($m['distance'], 2),
                'trips' => count(array_unique($m['trips'])),
                'mileage' => $m['liters'] > 0 ? round($m['distance'] / $m['liters'], 2) : 0,
                'cost_per_km' => $m['distance'] > 0 ? round($m['cost'] / $m['distance'], 2) : 0,
            ];
        }
        return $out;
    }

    protected function companyStats($entries)
    {
        $groups = $entries->groupBy('company_id');
        $out = [];
        foreach ($groups as $cid => $list) {
            $company = $list->first()->company;
            $liters = (float) $list->sum('quantity');
            $cost = (float) $list->sum('total_cost');
            $distance = (float) $list->sum(fn ($e) => $e->trip?->actualDistance());
            $out[] = [
                'id' => $cid,
                'company_name' => $company?->name ?: "Company #$cid",
                'entries' => $list->count(),
                'liters' => round($liters, 2),
                'cost' => round($cost, 2),
                'distance' => round($distance, 2),
                'mileage' => $liters > 0 ? round($distance / $liters, 2) : 0,
                'cost_per_km' => $distance > 0 ? round($cost / $distance, 2) : 0,
            ];
        }
        return $out;
    }

    protected function monthlySeries($entries)
    {
        $map = [];
        foreach ($entries as $e) {
            if (!$e->filled_at) continue;
            $key = $e->filled_at->format('Y-m');
            if (!isset($map[$key])) $map[$key] = ['month' => $key, 'liters' => 0, 'cost' => 0, 'entries' => 0];
            $map[$key]['liters'] += (float) $e->quantity;
            $map[$key]['cost'] += (float) $e->total_cost;
            $map[$key]['entries']++;
        }
        $out = array_values($map);
        usort($out, fn ($a, $b) => strcmp($a['month'], $b['month']));
        foreach ($out as $k => $v) {
            $out[$k]['liters'] = round($v['liters'], 2);
            $out[$k]['cost'] = round($v['cost'], 2);
        }
        return $out;
    }

    protected function yearlySeries($entries)
    {
        $map = [];
        foreach ($entries as $e) {
            if (!$e->filled_at) continue;
            $key = $e->filled_at->format('Y');
            if (!isset($map[$key])) $map[$key] = ['year' => $key, 'liters' => 0, 'cost' => 0, 'entries' => 0];
            $map[$key]['liters'] += (float) $e->quantity;
            $map[$key]['cost'] += (float) $e->total_cost;
            $map[$key]['entries']++;
        }
        $out = array_values($map);
        usort($out, fn ($a, $b) => strcmp($a['year'], $b['year']));
        foreach ($out as $k => $v) {
            $out[$k]['liters'] = round($v['liters'], 2);
            $out[$k]['cost'] = round($v['cost'], 2);
        }
        return $out;
    }

    protected function anomalyStats()
    {
        $flagged = FuelEntry::where('is_flagged', true)
            ->with(['trip', 'vehicle', 'driver', 'company'])
            ->latest('filled_at')
            ->get();

        $byRule = [];
        foreach ($flagged as $entry) {
            foreach ($entry->flags ?: [] as $flag) {
                $rule = $flag['rule'] ?? 'unknown';
                $byRule[$rule] = ($byRule[$rule] ?? 0) + 1;
            }
        }

        return [
            'total_flagged' => $flagged->count(),
            'pending_review' => $flagged->where('status', FuelEntry::STATUS_PENDING)->count(),
            'by_rule' => $byRule,
            'entries' => FuelEntryResource::collection($flagged),
        ];
    }

    protected function statsFor($entries, ?Vehicle $vehicle, $driverId, ?float $distance = null)
    {
        $liters = (float) $entries->sum('quantity');
        $cost = (float) $entries->sum('total_cost');
        $distance = $distance ?? (float) $entries->sum(fn ($e) => $e->trip?->actualDistance());
        $count = $entries->count();

        return [
            'entries' => $count,
            'liters' => round($liters, 2),
            'cost' => round($cost, 2),
            'distance' => round($distance, 2),
            'avg_mileage' => $liters > 0 ? round($distance / $liters, 2) : 0,
            'cost_per_km' => $distance > 0 ? round($cost / $distance, 2) : 0,
            'avg_cost_per_liter' => $liters > 0 ? round($cost / $liters, 2) : 0,
            'best_mileage' => $this->bestTripMileage($entries),
            'worst_mileage' => $this->worstTripMileage($entries),
            'tank_capacity' => $vehicle?->tankCapacity() ?? null,
            'manufacturer_mileage' => $vehicle?->manufacturer_mileage,
            'current_avg_mileage' => $vehicle?->current_avg_mileage,
        ];
    }

    protected function emptyStats(): array
    {
        return [
            'entries' => 0,
            'liters' => 0,
            'cost' => 0,
            'distance' => 0,
            'avg_mileage' => 0,
            'cost_per_km' => 0,
            'avg_cost_per_liter' => 0,
        ];
    }

    protected function distanceForVehicle(Vehicle $vehicle): float
    {
        return Trip::where('vehicle_id', $vehicle->id)
            ->where('status', 'Completed')
            ->get()
            ->sum(fn ($t) => $t->actualDistance());
    }

    protected function bestTripMileage($entries): array
    {
        $best = null;
        foreach ($entries as $e) {
            $m = $e->trip?->actualMileage();
            if ($m > 0 && (!$best || $m > $best['mileage'])) {
                $best = ['trip_id' => $e->trip_id, 'mileage' => $m, 'route' => ($e->trip?->pickup_location ?? '') . ' → ' . ($e->trip?->destination ?? '')];
            }
        }
        return $best ?: ['trip_id' => null, 'mileage' => 0, 'route' => '—'];
    }

    protected function worstTripMileage($entries): array
    {
        $worst = null;
        foreach ($entries as $e) {
            $m = $e->trip?->actualMileage();
            if ($m > 0 && (!$worst || $m < $worst['mileage'])) {
                $worst = ['trip_id' => $e->trip_id, 'mileage' => $m, 'route' => ($e->trip?->pickup_location ?? '') . ' → ' . ($e->trip?->destination ?? '')];
            }
        }
        return $worst ?: ['trip_id' => null, 'mileage' => 0, 'route' => '—'];
    }
}
