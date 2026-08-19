<?php

namespace App\Services\Intelligence;

use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Trip;
use App\Models\Company;
use App\Models\RouteStatistic;
use App\Models\VehicleStatistic;
use App\Models\FuelEntry;

class FuelScoreCalculator
{
    public function vehicleScore(Vehicle $vehicle): int
    {
        $stats = $vehicle->statistic;
        if (!$stats) return 50;

        $mfgMileage = max(0.1, $vehicle->manufacturer_mileage ?: 4.0);
        $avgMileage = $stats->avg_mileage_kmpl ?: $vehicle->current_learned_mileage;
        $mileageEfficiency = min(100, ($avgMileage / $mfgMileage) * 100);

        // Anomaly penalty rate
        $flaggedCount = FuelEntry::where('vehicle_id', $vehicle->id)->where('is_flagged', true)->count();
        $totalEntries = max(1, FuelEntry::where('vehicle_id', $vehicle->id)->count());
        $anomalyPenalty = min(30, ($flaggedCount / $totalEntries) * 100);

        $sampleConfidence = min(1.0, $stats->total_trips / 10);
        $score = (($mileageEfficiency * 0.7) + 30 - $anomalyPenalty) * $sampleConfidence + (50 * (1 - $sampleConfidence));

        $finalScore = (int) max(0, min(100, round($score)));

        $stats->update(['fuel_score' => $finalScore]);
        return $finalScore;
    }

    /**
     * Load-Normalized Driver Efficiency Score Calculation.
     * Factors in cargo load ratios, vehicle baseline mileage, and route terrain without penalizing
     * drivers for operating heavy loads on challenging routes.
     */
    public function driverScore(Driver $driver): int
    {
        $stats = $driver->statistic;
        if (!$stats) return 50;

        $trips = Trip::where('driver_id', $driver->id)
            ->where('status', 'Completed')
            ->with(['vehicle', 'order'])
            ->get();

        if ($trips->isEmpty()) {
            $stats->update(['fuel_score' => 50, 'driving_efficiency_score' => 50]);
            return 50;
        }

        $totalNormalizedScore = 0;
        $validTrips = 0;

        foreach ($trips as $trip) {
            $dist = $trip->actualDistance();
            $liters = $trip->actualFuelLiters();
            if ($dist <= 0 || $liters <= 0) continue;

            $actualKmpl = $dist / $liters;

            // Vehicle expected base mileage
            $baseMileage = max(0.1, $trip->vehicle?->manufacturer_mileage ?: ($trip->vehicle?->current_avg_mileage ?: 4.0));

            // Cargo Load Adjustment Factor (Full load expects ~15% higher fuel consumption -> 1.15 load factor)
            $cargoWeight = (float) ($trip->cargo_weight ?? 0);
            $capacity = max(1, (float) ($trip->vehicle?->capacity ?? 10000));
            $loadRatio = min(1.0, $cargoWeight / $capacity);
            $loadAdjustment = 1.0 + ($loadRatio * 0.15);

            // Normalized expected mileage for this specific trip condition
            $expectedKmpl = $baseMileage / $loadAdjustment;

            // Performance ratio (%)
            $tripEfficiency = min(120, ($actualKmpl / max(0.1, $expectedKmpl)) * 100);
            $totalNormalizedScore += $tripEfficiency;
            $validTrips++;
        }

        $avgNormalizedEfficiency = $validTrips > 0 ? ($totalNormalizedScore / $validTrips) : 50;

        // Sample size confidence (requires ~10 trips for 100% confidence)
        $sampleConfidence = min(1.0, $validTrips / 10);
        $finalScore = (int) max(0, min(100, round(($avgNormalizedEfficiency * $sampleConfidence) + (50 * (1 - $sampleConfidence)))));

        $stats->update([
            'fuel_score' => $finalScore,
            'driving_efficiency_score' => $finalScore,
        ]);

        return $finalScore;
    }

    public function routeScore(string $pickup, string $destination): int
    {
        $stats = RouteStatistic::where('pickup_location', $pickup)->where('destination', $destination)->first();
        if (!$stats) return 50;

        $score = min(100, ($stats->avg_mileage_kmpl / 4.0) * 100);
        $finalScore = (int) max(0, min(100, $score));

        $stats->update(['route_fuel_score' => $finalScore]);
        return $finalScore;
    }

    public function tripScore(Trip $trip): ?int
    {
        if ($trip->status !== 'Completed') return null;

        $actual = $trip->actualFuelCost();
        $predicted = $trip->estimated_fuel_cost;

        if ($predicted <= 0) return 50;

        $variance = abs(($actual - $predicted) / $predicted);
        $score = max(0, 100 - ($variance * 100));

        $finalScore = (int) max(0, min(100, $score));
        $trip->update(['trip_fuel_score' => $finalScore]);

        return $finalScore;
    }

    public function companyScore(Company $company): int
    {
        $stats = $company->statistic;
        if (!$stats) return 50;
        return 75;
    }

    public function fleetScore(): int
    {
        $scores = VehicleStatistic::whereNotNull('fuel_score')->pluck('fuel_score');
        if ($scores->isEmpty()) return 50;
        return (int) round($scores->avg());
    }
}
