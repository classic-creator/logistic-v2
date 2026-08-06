<?php

namespace App\Jobs;

use App\Models\Trip;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\Intelligence\StatisticsAggregator;
use App\Services\Intelligence\LearningEngine;
use App\Services\Intelligence\FuelScoreCalculator;
use App\Services\Intelligence\PredictionEngine;

class RecalculateStatisticsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public Trip $trip;

    public function __construct(Trip $trip)
    {
        $this->trip = $trip;
    }

    public function handle(
        StatisticsAggregator $aggregator,
        LearningEngine $learningEngine,
        FuelScoreCalculator $scoreCalculator,
        PredictionEngine $predictionEngine
    ): void {
        $this->trip->load('vehicle', 'driver', 'order.company');

        if ($this->trip->vehicle) {
            $aggregator->recalculateVehicle($this->trip->vehicle);
            $learningEngine->learnVehicleMileage($this->trip->vehicle, $this->trip);
            $scoreCalculator->vehicleScore($this->trip->vehicle);
        }

        if ($this->trip->driver) {
            $aggregator->recalculateDriver($this->trip->driver);
            $learningEngine->learnDriverEfficiency($this->trip->driver, $this->trip);
            $scoreCalculator->driverScore($this->trip->driver);
        }

        if ($this->trip->pickup_location && $this->trip->destination) {
            $aggregator->recalculateRoute($this->trip->pickup_location, $this->trip->destination);
            $learningEngine->learnRouteMileage($this->trip->pickup_location, $this->trip->destination);
            $scoreCalculator->routeScore($this->trip->pickup_location, $this->trip->destination);
        }

        if ($this->trip->order && $this->trip->order->company) {
            $aggregator->recalculateCustomer($this->trip->order->company);
            $scoreCalculator->companyScore($this->trip->order->company);
        }

        $predictionEngine->trackAccuracy($this->trip);
        $scoreCalculator->tripScore($this->trip);
        
        $this->trip->update([
            'actual_distance' => $this->trip->actualDistance(),
            'actual_fuel_liters' => $this->trip->actualFuelLiters(),
            'actual_fuel_cost' => $this->trip->actualFuelCost(),
            'actual_mileage' => $this->trip->actualMileage(),
        ]);
        
        if ($this->trip->fuel_budget > 0) {
            $this->trip->update([
                'fuel_variance_percent' => (($this->trip->actual_fuel_cost - $this->trip->fuel_budget) / $this->trip->fuel_budget) * 100
            ]);
        }
    }
}
