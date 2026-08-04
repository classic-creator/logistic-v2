<?php

namespace App\Services;

use App\Models\Trip;
use App\Models\Vehicle;
use App\Models\FuelPrice;
use App\Models\FuelEntry;

/**
 * Fuel Estimation Engine.
 *
 * Pipeline: Distance -> Vehicle Mileage -> Fuel Required -> Fuel Price -> Estimated Cost.
 * The engine trusts historical mileage over manufacturer specs and uses the fuel
 * price snapshot valid at the trip start time.
 */
class FuelEstimationService
{
    public const MILEAGE_WINDOW_DAYS = 180;

    /**
     * Run the full estimation pipeline for a trip and persist the result.
     */
    public function estimateAndPersist(Trip $trip): Trip
    {
        $estimate = $this->estimate($trip);
        $trip->update([
            'estimated_distance' => $estimate['distance'],
            'estimated_fuel_liters' => $estimate['fuel_liters'],
            'estimated_fuel_cost' => $estimate['fuel_cost'],
            'estimated_mileage' => $estimate['mileage'],
            'estimated_travel_hours' => $estimate['travel_hours'],
            'fuel_price_per_liter' => $estimate['price_per_liter'],
            'fuel_price_id' => $estimate['fuel_price_id'],
        ]);
        return $trip->refresh();
    }

    /**
     * Compute an estimate without persisting (used for live previews).
     */
    public function estimate(Trip $trip, ?Vehicle $vehicle = null): array
    {
        $vehicle = $vehicle ?? $trip->vehicle;
        $distance = $this->resolveDistance($trip);
        $mileage = $vehicle ? $this->resolveMileage($vehicle) : 4.0;

        $fuelLiters = $distance > 0 ? round($distance / max($mileage, 0.1), 2) : 0;
        $price = $this->resolvePrice($trip, $vehicle);
        $fuelCost = $fuelLiters > 0 ? round($fuelLiters * $price['price_per_liter'], 2) : 0;

        return [
            'distance' => round($distance, 2),
            'mileage' => round($mileage, 2),
            'fuel_liters' => $fuelLiters,
            'price_per_liter' => $price['price_per_liter'],
            'fuel_price_id' => $price['id'],
            'fuel_cost' => $fuelCost,
            'travel_hours' => $this->resolveTravelHours($trip, $distance),
        ];
    }

    public function resolveDistance(Trip $trip): float
    {
        return (float) ($trip->distance ?? $trip->order?->route_distance_km ?? 0);
    }

    public function resolveTravelHours(Trip $trip, ?float $distance = null): float
    {
        if ($trip->estimated_duration) {
            return round((float) $trip->estimated_duration, 2);
        }
        $distance = $distance ?? $this->resolveDistance($trip);
        return $distance > 0 ? round($distance / 40, 2) : 0;
    }

    /**
     * Historical mileage primarily, falling back to loaded/empty/manufacturer.
     */
    public function resolveMileage(Vehicle $vehicle): float
    {
        $historical = $this->historicalAverageMileage($vehicle);
        if ($historical > 0) {
            return round($historical, 2);
        }
        return $vehicle->effectiveMileage();
    }

    /**
     * Rolling average mileage derived from approved fuel entries across completed trips.
     */
    public function historicalAverageMileage(Vehicle $vehicle): float
    {
        $entries = FuelEntry::query()
            ->where('vehicle_id', $vehicle->id)
            ->where('status', FuelEntry::STATUS_APPROVED)
            ->where('quantity', '>', 0)
            ->whereBetween('filled_at', [now()->subDays(self::MILEAGE_WINDOW_DAYS), now()])
            ->orderBy('filled_at')
            ->get(['odometer', 'quantity', 'trip_id']);

        if ($entries->count() < 2) {
            return 0;
        }

        // Sort by odometer and compute segment distances between consecutive fills.
        $sorted = $entries->sortBy('odometer')->values();
        $totalDistance = 0;
        $totalFuel = 0;
        $prev = null;
        foreach ($sorted as $entry) {
            if ($prev && $entry->odometer > $prev->odometer) {
                $totalDistance += $entry->odometer - $prev->odometer;
            }
            $totalFuel += (float) $entry->quantity;
            $prev = $entry;
        }

        if ($totalFuel <= 0 || $totalDistance <= 0) {
            return 0;
        }

        return round($totalDistance / $totalFuel, 2);
    }

    /**
     * Resolve the applicable fuel price with fallback chain:
     * city-level -> state-level -> global, honoring effective dates.
     */
    public function resolvePrice(Trip $trip, ?Vehicle $vehicle = null): array
    {
        $fuelType = $vehicle?->fuel_type ?: 'Diesel';
        $city = $trip->pickup_location ?: null;
        $at = $trip->start_date ?: $trip->created_at ?: now();

        $price = FuelPrice::resolve($city, $fuelType, $trip->company_id, $at);

        if ($price) {
            return [
                'id' => $price->id,
                'price_per_liter' => (float) $price->price_per_liter,
            ];
        }

        // Default market fallback price.
        $default = $fuelType === 'Petrol' ? 106.00 : ($fuelType === 'CNG' ? 76.00 : 92.00);
        return [
            'id' => null,
            'price_per_liter' => $default,
        ];
    }

    /**
     * Refresh the trip's derived actuals once fuel entries change.
     */
    public function refreshTripActuals(Trip $trip): Trip
    {
        $trip->update([
            'actual_fuel_liters' => $trip->actualFuelLiters(),
            'actual_fuel_cost' => $trip->actualFuelCost(),
            'actual_mileage' => $trip->actualMileage(),
            'fuel_variance_status' => $trip->fuelVarianceStatus(),
        ]);

        $this->refreshVehicleMileage($trip->vehicle);

        return $trip->refresh();
    }

    public function refreshVehicleMileage(?Vehicle $vehicle): void
    {
        if (!$vehicle) return;
        $historical = $this->historicalAverageMileage($vehicle);
        if ($historical > 0) {
            $vehicle->update(['current_avg_mileage' => $historical]);
        }
        $lastOdometer = FuelEntry::query()
            ->where('vehicle_id', $vehicle->id)
            ->where('odometer', '>', 0)
            ->max('odometer');
        if ($lastOdometer) {
            $vehicle->update(['last_odometer' => $lastOdometer]);
        }
    }
}
