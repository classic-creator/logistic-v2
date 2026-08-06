<?php

namespace App\Services\Intelligence;

use App\Models\Trip;
use App\Models\FuelPrice;
use App\Models\PredictionHistory;
use App\Models\RouteStatistic;
use App\Services\FuelEstimationService;

/**
 * PredictionEngine
 * ================
 * Hybrid fuel prediction pipeline:
 *
 * 1. PRIMARY  — Python ML Engine (FastAPI + HistGradientBoostingRegressor)
 *               Provides: point estimate, 90% CI bounds, feature importances, R²
 *
 * 2. FALLBACK — Weighted EWMA Blending (Statistical ML)
 *               Blends: learned vehicle mileage (40%) + driver mileage (30%) + route mileage (30%)
 *               with cargo-weight dynamic adjustment
 *
 * The engine always persists a PredictionHistory record and updates the trip's
 * fuel_budget (point + 10% contingency buffer).
 */
class PredictionEngine
{
    protected FuelEstimationService $estimationService;
    protected PythonMlService       $mlService;

    public function __construct(FuelEstimationService $estimationService, PythonMlService $mlService)
    {
        $this->estimationService = $estimationService;
        $this->mlService         = $mlService;
    }

    public function predictTrip(Trip $trip): PredictionHistory
    {
        $trip->load(['vehicle.statistic', 'driver.statistic', 'order']);

        $vehicle    = $trip->vehicle;
        $driver     = $trip->driver;
        $routeStats = RouteStatistic::where('pickup_location', $trip->pickup_location)
            ->where('destination', $trip->destination)
            ->first();

        $distance = $routeStats?->avg_distance_km
            ?: ($trip->order?->route_distance_km ?: ($trip->estimated_distance ?? 0));

        // ---- 1. Try Python ML Engine ------------------------------------
        $mlResult = $this->mlService->predict($trip);

        if ($mlResult['ml_available'] ?? false) {
            return $this->persistFromMl($trip, $mlResult, $distance, $routeStats);
        }

        // ---- 2. Fallback: EWMA statistical blending ---------------------
        return $this->persistFromEwma($trip, $vehicle, $driver, $routeStats, $distance);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private function persistFromMl(Trip $trip, array $ml, float $distance, ?RouteStatistic $routeStats): PredictionHistory
    {
        $priceInfo = $this->estimationService->resolvePrice($trip, $trip->vehicle);
        $price     = $priceInfo['price_per_liter'];

        $predictedFuel = (float) $ml['predicted_fuel_liters'];
        $predictedCost = $predictedFuel * $price;
        $ciLower       = (float) ($ml['ci_lower_liters'] ?? $predictedFuel * 0.9);
        $ciUpper       = (float) ($ml['ci_upper_liters'] ?? $predictedFuel * 1.1);
        $predictedDur  = $routeStats?->avg_duration_hours ?: ($distance > 0 ? $distance / 45 : 0);
        $predictedProfit = ($routeStats?->avg_revenue ?? 0) - $predictedCost;

        $factors = [
            'engine'              => 'python_ml',
            'model_r2'            => $ml['model_r2'] ?? null,
            'model_mae'           => $ml['model_mae'] ?? null,
            'ci_lower_liters'     => $ciLower,
            'ci_upper_liters'     => $ciUpper,
            'ci_lower_cost'       => round($ciLower * $this->estimationService->resolvePrice($trip, $trip->vehicle)['price_per_liter'], 2),
            'ci_upper_cost'       => round($ciUpper * $this->estimationService->resolvePrice($trip, $trip->vehicle)['price_per_liter'], 2),
            'feature_importances' => $ml['feature_importances'] ?? [],
            'price_used'          => $price,
            'n_training_samples'  => $ml['n_training_samples'] ?? 0,
            'model_source'        => $ml['model_source'] ?? 'unknown',
        ];

        $prediction = PredictionHistory::updateOrCreate(
            ['trip_id' => $trip->id],
            [
                'predicted_distance'       => $distance,
                'predicted_fuel_liters'    => $predictedFuel,
                'predicted_fuel_cost'      => $predictedCost,
                'predicted_mileage'        => $distance > 0 && $predictedFuel > 0 ? round($distance / $predictedFuel, 2) : 0,
                'predicted_duration_hours' => $predictedDur,
                'predicted_profit'         => $predictedProfit,
                'prediction_factors'       => json_encode($factors),
            ]
        );

        $trip->update([
            'prediction_id' => $prediction->id,
            'fuel_budget'   => round($predictedCost * 1.10, 2),
        ]);

        return $prediction;
    }

    private function persistFromEwma(Trip $trip, $vehicle, $driver, ?RouteStatistic $routeStats, float $distance): PredictionHistory
    {
        $vehicleMileage = $vehicle?->statistic?->current_learned_mileage ?: ($vehicle?->effectiveMileage() ?: 4.0);
        $driverMileage  = $driver?->statistic?->avg_mileage_kmpl ?: $vehicleMileage;
        $routeMileage   = $routeStats?->avg_mileage_kmpl ?: $vehicleMileage;

        // Weighted blend: vehicle 40%, driver 30%, route 30%
        $blendedMileage = ($vehicleMileage * 0.4) + ($driverMileage * 0.3) + ($routeMileage * 0.3);

        $cargoWeight    = (float) $trip->cargo_weight;
        $capacity       = (float) $vehicle?->capacity ?: 10000;
        $cargoAdj       = 0;

        if ($cargoWeight > 0 && $capacity > 0) {
            $cargoAdj       = ($cargoWeight / $capacity) * 0.15;
            $blendedMileage = $blendedMileage * (1 - $cargoAdj);
        }

        $blendedMileage  = max($blendedMileage, 0.1);
        $predictedFuel   = $distance > 0 ? $distance / $blendedMileage : 0;

        $priceInfo       = $this->estimationService->resolvePrice($trip, $vehicle);
        $price           = $priceInfo['price_per_liter'];
        $predictedCost   = $predictedFuel * $price;
        $predictedDur    = $routeStats?->avg_duration_hours ?: ($distance > 0 ? $distance / 45 : 0);
        $predictedProfit = ($routeStats?->avg_revenue ?? 0) - $predictedCost;

        $prediction = PredictionHistory::updateOrCreate(
            ['trip_id' => $trip->id],
            [
                'predicted_distance'       => $distance,
                'predicted_fuel_liters'    => $predictedFuel,
                'predicted_fuel_cost'      => $predictedCost,
                'predicted_mileage'        => $blendedMileage,
                'predicted_duration_hours' => $predictedDur,
                'predicted_profit'         => $predictedProfit,
                'prediction_factors'       => json_encode([
                    'engine'          => 'ewma_statistical',
                    'vehicle_mileage' => $vehicleMileage,
                    'driver_mileage'  => $driverMileage,
                    'route_mileage'   => $routeMileage,
                    'cargo_adjustment'=> $cargoAdj,
                    'price_used'      => $price,
                ]),
            ]
        );

        $trip->update([
            'prediction_id' => $prediction->id,
            'fuel_budget'   => round($predictedCost * 1.10, 2),
        ]);

        return $prediction;
    }

    public function trackAccuracy(Trip $completedTrip): void
    {
        $prediction = PredictionHistory::where('trip_id', $completedTrip->id)->first();
        if (!$prediction) return;

        $actualCost   = $completedTrip->actualFuelCost();
        $accuracyScore = 0;

        if ($prediction->predicted_fuel_cost > 0) {
            $diff          = abs(($prediction->predicted_fuel_cost - $actualCost) / $prediction->predicted_fuel_cost);
            $accuracyScore = max(0, 100 - ($diff * 100));
        }

        $prediction->update([
            'actual_distance'    => $completedTrip->actualDistance(),
            'actual_fuel_liters' => $completedTrip->actualFuelLiters(),
            'actual_fuel_cost'   => $actualCost,
            'actual_mileage'     => $completedTrip->actualMileage(),
            'accuracy_score'     => $accuracyScore,
        ]);
    }
}
