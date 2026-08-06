<?php

namespace App\Services\Intelligence;

use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Trip;
use App\Models\Company;
use App\Models\VehicleStatistic;
use App\Models\DriverStatistic;
use App\Models\RouteStatistic;
use App\Models\CustomerStatistic;
use App\Models\FuelEntry;
use Illuminate\Support\Facades\DB;

class StatisticsAggregator
{
    public function recalculateVehicle(Vehicle $vehicle): VehicleStatistic
    {
        $trips = Trip::where('vehicle_id', $vehicle->id)->where('status', 'Completed')->get();
        $totalTrips = $trips->count();
        $totalDistance = $trips->sum(fn($t) => $t->actualDistance() ?: $t->estimated_distance);
        
        $fuelEntries = FuelEntry::where('vehicle_id', $vehicle->id)->where('status', FuelEntry::STATUS_APPROVED)->get();
        $totalFuelLiters = $fuelEntries->sum('quantity');
        $totalFuelCost = $fuelEntries->sum('total_cost');
        
        $avgMileage = $totalFuelLiters > 0 ? round($totalDistance / $totalFuelLiters, 2) : 0;
        
        return VehicleStatistic::updateOrCreate(
            ['vehicle_id' => $vehicle->id],
            [
                'total_trips' => $totalTrips,
                'total_distance_km' => $totalDistance,
                'total_fuel_liters' => $totalFuelLiters,
                'total_fuel_cost' => $totalFuelCost,
                'avg_mileage_kmpl' => $avgMileage,
                'last_calculated_at' => now(),
            ]
        );
    }

    public function recalculateDriver(Driver $driver): DriverStatistic
    {
        $trips = Trip::where('driver_id', $driver->id)->where('status', 'Completed')->get();
        $totalTrips = $trips->count();
        $totalDistance = $trips->sum(fn($t) => $t->actualDistance() ?: $t->estimated_distance);
        
        $fuelEntries = FuelEntry::where('driver_id', $driver->id)->where('status', FuelEntry::STATUS_APPROVED)->get();
        $totalFuelLiters = $fuelEntries->sum('quantity');
        $totalFuelCost = $fuelEntries->sum('total_cost');
        
        $avgMileage = $totalFuelLiters > 0 ? round($totalDistance / $totalFuelLiters, 2) : 0;
        $avgCostPerKm = $totalDistance > 0 ? round($totalFuelCost / $totalDistance, 2) : 0;
        
        return DriverStatistic::updateOrCreate(
            ['driver_id' => $driver->id],
            [
                'total_trips' => $totalTrips,
                'total_distance_km' => $totalDistance,
                'total_fuel_liters' => $totalFuelLiters,
                'total_fuel_cost' => $totalFuelCost,
                'avg_mileage_kmpl' => $avgMileage,
                'avg_fuel_cost_per_km' => $avgCostPerKm,
                'last_calculated_at' => now(),
            ]
        );
    }

    public function recalculateRoute(string $pickup, string $destination): RouteStatistic
    {
        $routeKey = RouteStatistic::generateRouteKey($pickup, $destination);
        $trips = Trip::where('pickup_location', $pickup)
            ->where('destination', $destination)
            ->where('status', 'Completed')
            ->with(['financeLedger', 'fuelEntries' => function($q) {
                $q->where('status', FuelEntry::STATUS_APPROVED);
            }])->get();
            
        $totalTrips = $trips->count();
        if ($totalTrips === 0) {
            return RouteStatistic::firstOrCreate(
                ['route_key' => $routeKey],
                ['pickup_location' => $pickup, 'destination' => $destination]
            );
        }
        
        $totalDistance = 0;
        $totalFuelLiters = 0;
        $totalCost = 0;
        $totalDuration = 0;
        $totalRevenue = 0;
        $totalProfit = 0;
        
        $vehicleMileages = [];
        $driverMileages = [];

        foreach ($trips as $trip) {
            $dist = $trip->actualDistance() ?: $trip->estimated_distance;
            $liters = $trip->fuelEntries->sum('quantity');
            
            $totalDistance += $dist;
            $totalFuelLiters += $liters;
            $totalCost += $trip->fuelEntries->sum('total_cost');
            $totalDuration += $trip->estimated_travel_hours ?? 0;
            
            if ($trip->financeLedger) {
                $totalRevenue += $trip->financeLedger->trip_amount;
                $totalProfit += $trip->financeLedger->net_profit;
            }
            
            if ($dist > 0 && $liters > 0) {
                $mileage = $dist / $liters;
                if ($trip->vehicle_id) {
                    if (!isset($vehicleMileages[$trip->vehicle_id])) $vehicleMileages[$trip->vehicle_id] = [];
                    $vehicleMileages[$trip->vehicle_id][] = $mileage;
                }
                if ($trip->driver_id) {
                    if (!isset($driverMileages[$trip->driver_id])) $driverMileages[$trip->driver_id] = [];
                    $driverMileages[$trip->driver_id][] = $mileage;
                }
            }
        }
        
        $bestVehicleId = null;
        $worstVehicleId = null;
        if (!empty($vehicleMileages)) {
            $avgVehicles = array_map(fn($v) => array_sum($v)/count($v), $vehicleMileages);
            asort($avgVehicles);
            $worstVehicleId = array_key_first($avgVehicles);
            $bestVehicleId = array_key_last($avgVehicles);
        }
        
        $bestDriverId = null;
        $worstDriverId = null;
        if (!empty($driverMileages)) {
            $avgDrivers = array_map(fn($v) => array_sum($v)/count($v), $driverMileages);
            asort($avgDrivers);
            $worstDriverId = array_key_first($avgDrivers);
            $bestDriverId = array_key_last($avgDrivers);
        }
        
        return RouteStatistic::updateOrCreate(
            ['route_key' => $routeKey],
            [
                'pickup_location' => $pickup,
                'destination' => $destination,
                'total_trips' => $totalTrips,
                'avg_distance_km' => $totalDistance / $totalTrips,
                'avg_fuel_liters' => $totalFuelLiters / $totalTrips,
                'avg_fuel_cost' => $totalCost / $totalTrips,
                'avg_duration_hours' => $totalDuration / $totalTrips,
                'avg_mileage_kmpl' => $totalFuelLiters > 0 ? $totalDistance / $totalFuelLiters : 0,
                'avg_revenue' => $totalRevenue / $totalTrips,
                'avg_profit' => $totalProfit / $totalTrips,
                'best_vehicle_id' => $bestVehicleId,
                'best_driver_id' => $bestDriverId,
                'worst_vehicle_id' => $worstVehicleId,
                'worst_driver_id' => $worstDriverId,
            ]
        );
    }

    public function recalculateCustomer(Company $company): CustomerStatistic
    {
        $trips = Trip::where('company_id', $company->id)
            ->where('status', 'Completed')
            ->with('financeLedger')
            ->get();
            
        $totalTrips = $trips->count();
        if ($totalTrips === 0) {
            return CustomerStatistic::firstOrCreate(['company_id' => $company->id]);
        }
        
        $totalDistance = 0;
        $totalCost = 0;
        $totalRevenue = 0;
        $totalProfit = 0;
        $routes = [];
        
        foreach ($trips as $trip) {
            $dist = $trip->actualDistance() ?: $trip->estimated_distance;
            $cost = $trip->actualFuelCost();
            
            $totalDistance += $dist;
            $totalCost += $cost;
            
            if ($trip->financeLedger) {
                $totalRevenue += $trip->financeLedger->trip_amount;
                $totalProfit += $trip->financeLedger->net_profit;
            }
            
            $routeKey = RouteStatistic::generateRouteKey($trip->pickup_location, $trip->destination);
            $routes[$routeKey] = ($routes[$routeKey] ?? 0) + 1;
        }
        
        arsort($routes);
        $mostUsedRoute = array_key_first($routes);
        
        return CustomerStatistic::updateOrCreate(
            ['company_id' => $company->id],
            [
                'total_trips' => $totalTrips,
                'total_distance_km' => $totalDistance,
                'total_fuel_cost' => $totalCost,
                'avg_revenue_per_trip' => $totalRevenue / $totalTrips,
                'avg_profit_per_trip' => $totalProfit / $totalTrips,
                'avg_cost_per_km' => $totalDistance > 0 ? $totalCost / $totalDistance : 0,
                'most_used_route' => $mostUsedRoute,
            ]
        );
    }
    
    public function recalculateAll(): void
    {
        Vehicle::all()->each(fn($v) => $this->recalculateVehicle($v));
        Driver::all()->each(fn($d) => $this->recalculateDriver($d));
        Company::all()->each(fn($c) => $this->recalculateCustomer($c));
        
        $routes = Trip::where('status', 'Completed')->select('pickup_location', 'destination')->distinct()->get();
        foreach ($routes as $route) {
            if ($route->pickup_location && $route->destination) {
                $this->recalculateRoute($route->pickup_location, $route->destination);
            }
        }
    }
}
