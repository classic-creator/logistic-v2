<?php

namespace App\Services\Intelligence;

use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Trip;
use App\Models\RouteStatistic;

class RecommendationEngine
{
    protected PredictionEngine $predictionEngine;

    public function __construct(PredictionEngine $predictionEngine)
    {
        $this->predictionEngine = $predictionEngine;
    }

    public function recommendVehicle(string $pickup, string $destination, ?float $cargoWeight = null): array
    {
        $vehicles = Vehicle::with('statistic')->get(); // Ideally filter available ones
        $routeStats = RouteStatistic::where('pickup_location', $pickup)->where('destination', $destination)->first();
        
        $scored = [];
        foreach ($vehicles as $vehicle) {
            $fuelScore = $vehicle->statistic?->fuel_score ?? 50;
            $learnedMileage = $vehicle->statistic?->current_learned_mileage ?? $vehicle->effectiveMileage();
            
            $routeScore = 50;
            if ($routeStats && $routeStats->best_vehicle_id == $vehicle->id) {
                $routeScore = 100;
            } elseif ($routeStats && $routeStats->worst_vehicle_id == $vehicle->id) {
                $routeScore = 10;
            }
            
            $capacityScore = 50;
            if ($cargoWeight && $vehicle->capacity) {
                $capacityScore = $cargoWeight <= $vehicle->capacity ? 100 : 0;
            }

            $score = ($fuelScore * 0.4) + (min(100, $learnedMileage * 10) * 0.3) + ($routeScore * 0.2) + ($capacityScore * 0.1);
            
            $scored[] = [
                'vehicle_id' => $vehicle->id,
                'vehicle_number' => $vehicle->number,
                'score' => round($score, 2),
                'confidence_percent' => $vehicle->statistic?->confidence_score * 100 ?? 50,
                'reasoning' => "Fuel Score: {$fuelScore}, Learned Mileage: {$learnedMileage}",
            ];
        }
        
        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);
        return array_slice($scored, 0, 3);
    }

    public function recommendDriver(string $pickup, string $destination, ?int $vehicleId = null): array
    {
        $drivers = Driver::with('statistic')->get();
        $routeStats = RouteStatistic::where('pickup_location', $pickup)->where('destination', $destination)->first();
        
        $scored = [];
        foreach ($drivers as $driver) {
            $fuelScore = $driver->statistic?->fuel_score ?? 50;
            
            $routeScore = 50;
            if ($routeStats && $routeStats->best_driver_id == $driver->id) {
                $routeScore = 100;
            } elseif ($routeStats && $routeStats->worst_driver_id == $driver->id) {
                $routeScore = 10;
            }
            
            $efficiency = min(100, ($driver->statistic?->avg_mileage_kmpl ?? 4.0) * 10);
            
            $score = ($fuelScore * 0.4) + ($routeScore * 0.3) + ($efficiency * 0.3);
            
            $scored[] = [
                'driver_id' => $driver->id,
                'driver_name' => $driver->name,
                'score' => round($score, 2),
                'confidence_percent' => 70, // placeholder
                'reasoning' => "Fuel Score: {$fuelScore}, Route Familiarity: {$routeScore}",
            ];
        }
        
        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);
        return array_slice($scored, 0, 3);
    }

    public function recommendFuelBudget(Trip $trip): array
    {
        $prediction = $this->predictionEngine->predictTrip($trip);
        
        $cost = $prediction->predicted_fuel_cost;
        $budget = $cost * 1.1;
        $consumed = $trip->actualFuelCost();
        $remaining = $budget - $consumed;
        
        $color = 'green';
        if ($consumed > $budget) $color = 'red';
        elseif ($consumed > $cost) $color = 'yellow';

        return [
            'estimated_fuel_liters' => $prediction->predicted_fuel_liters,
            'estimated_cost' => $cost,
            'budget' => $budget,
            'consumed' => $consumed,
            'remaining' => $remaining,
            'variance' => $consumed > 0 ? (($consumed - $cost) / $cost) * 100 : 0,
            'color' => $color,
        ];
    }

    public function recommendFuelStops(Trip $trip): array
    {
        $prediction = $this->predictionEngine->predictTrip($trip);
        $distance = $prediction->predicted_distance;
        $mileage = $prediction->predicted_mileage;
        
        $tankCapacity = $trip->vehicle?->tankCapacity() ?: 300;
        $safeRange = $tankCapacity * $mileage * 0.8; // 80% usage
        
        $stops = [];
        $stopsCount = floor($distance / $safeRange);
        
        for ($i = 1; $i <= $stopsCount; $i++) {
            $stops[] = [
                'stop_number' => $i,
                'estimated_km' => round($i * $safeRange, 2),
                'estimated_liters_needed' => round($tankCapacity * 0.8, 2),
            ];
        }
        
        return $stops;
    }
}
