<?php

namespace App\Services\Intelligence;

use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Trip;
use App\Models\Company;
use App\Models\RouteStatistic;
use App\Models\VehicleStatistic;

class FuelScoreCalculator
{
    public function vehicleScore(Vehicle $vehicle): int
    {
        $stats = $vehicle->statistic;
        if (!$stats) return 50;

        $mfgMileage = max(0.1, $vehicle->manufacturer_mileage ?: 4.0);
        $mileageEfficiency = min(100, ($stats->avg_mileage_kmpl / $mfgMileage) * 100);
        
        // Mock cost efficiency comparing to fleet average could be more complex
        $costEfficiency = 50; // default average
        
        // Mock anomaly rate
        $anomalyRate = 0; // ideally query flagged fuel entries
        
        $trendBonus = 5; // simplified
        
        $score = ($mileageEfficiency * 0.4) + ($costEfficiency * 0.3) + ((1 - $anomalyRate) * 100 * 0.2) + $trendBonus;
        
        $finalScore = (int) max(0, min(100, $score));
        
        $stats->update(['fuel_score' => $finalScore]);
        return $finalScore;
    }

    public function driverScore(Driver $driver): int
    {
        $stats = $driver->statistic;
        if (!$stats) return 50;
        
        $mileageEfficiency = min(100, ($stats->avg_mileage_kmpl / 4.0) * 100);
        $score = $mileageEfficiency; // Simplified for driver
        
        $finalScore = (int) max(0, min(100, $score));
        
        $stats->update(['fuel_score' => $finalScore]);
        return $finalScore;
    }

    public function routeScore(string $pickup, string $destination): int
    {
        $stats = RouteStatistic::where('pickup_location', $pickup)->where('destination', $destination)->first();
        if (!$stats) return 50;
        
        $score = min(100, ($stats->avg_mileage_kmpl / 4.0) * 100); // Simplified
        $finalScore = (int) max(0, min(100, $score));
        
        $stats->update(['route_fuel_score' => $finalScore]);
        return $finalScore;
    }

    public function tripScore(Trip $trip): ?int
    {
        if ($trip->status !== 'Completed') return null;
        
        $actual = $trip->actualFuelCost();
        $predicted = $trip->estimated_fuel_cost; // or prediction->predicted_fuel_cost
        
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
        return 75; // Simplified for now
    }

    public function fleetScore(): int
    {
        $scores = VehicleStatistic::whereNotNull('fuel_score')->pluck('fuel_score');
        if ($scores->isEmpty()) return 50;
        return (int) $scores->avg();
    }
}
