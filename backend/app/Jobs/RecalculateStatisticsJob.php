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
use App\Services\Intelligence\PythonMlService;
use App\Services\Intelligence\StageEngine;

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
        PredictionEngine $predictionEngine,
        PythonMlService $mlService
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

        // Automatic Real Data ML Retraining Loop
        $totalValidRealTrips = Trip::where('status', 'Completed')
            ->where('is_synthetic', false)
            ->whereNotNull('actual_fuel_liters')
            ->count();

        if ($totalValidRealTrips >= StageEngine::ML_ACTIVATION_THRESHOLD) {
            $realTripsData = Trip::where('status', 'Completed')
                ->where('is_synthetic', false)
                ->whereNotNull('actual_fuel_liters')
                ->with(['vehicle', 'driver', 'order'])
                ->get()
                ->map(fn($t) => [
                    'distance_km'      => (float) ($t->actual_distance ?: ($t->estimated_distance ?? 0)),
                    'cargo_weight'     => (float) ($t->cargo_weight ?? 0),
                    'vehicle_capacity' => (float) ($t->vehicle?->capacity ?? 10000),
                    'driver_score'     => (float) ($t->driver?->statistic?->driving_efficiency_score ?? 75),
                    'vehicle_age_km'   => (float) ($t->vehicle?->last_odometer ?? 50000),
                    'vehicle_type'     => strtolower($t->vehicle?->type ?? 'truck'),
                    'route_terrain'    => 'mixed',
                    'traffic_index'    => 'mixed',
                    'temp_celsius'     => 28.0,
                    'actual_fuel_liters' => (float) $t->actualFuelLiters(),
                ])->toArray();

            $mlService->retrain($realTripsData);
        }
    }
}
