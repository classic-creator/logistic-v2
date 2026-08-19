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
 * Progressive fuel prediction pipeline governed by StageEngine:
 *
 * Stage 1: Cold-Start Baseline ("Baseline Estimate", 50% Confidence)
 * Stage 2: Vehicle EWMA       ("Historical Estimate", 65% Confidence)
 * Stage 3: Multi-Factor EWMA  ("Historical Estimate", 80% Confidence)
 * Stage 4: Python ML Engine   ("ML Prediction", >=88% Confidence)
 */
class PredictionEngine
{
    protected FuelEstimationService $estimationService;
    protected PythonMlService       $mlService;
    protected StageEngine           $stageEngine;

    public function __construct(
        FuelEstimationService $estimationService,
        PythonMlService $mlService,
        StageEngine $stageEngine
    ) {
        $this->estimationService = $estimationService;
        $this->mlService         = $mlService;
        $this->stageEngine       = $stageEngine;
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

        // Evaluate Progressive Stage & Cold-Start Status
        $stageMeta = $this->stageEngine->evaluateStage($trip);

        // Stage 4: High-quality dataset qualifies for Python ML
        if ($stageMeta['stage'] === StageEngine::STAGE_4_ML_PREDICTION) {
            $mlResult = $this->mlService->predict($trip);
            if ($mlResult['ml_available'] ?? false) {
                return $this->persistFromMl($trip, $mlResult, $distance, $routeStats, $stageMeta);
            }
        }

        // Stage 1: Cold-Start Baseline
        if ($stageMeta['stage'] === StageEngine::STAGE_1_BASELINE) {
            return $this->persistFromColdStart($trip, $distance, $routeStats, $stageMeta);
        }

        // Stage 2 & 3: EWMA Statistical Blending
        return $this->persistFromEwma($trip, $vehicle, $driver, $routeStats, $distance, $stageMeta);
    }

    private function persistFromColdStart(Trip $trip, float $distance, ?RouteStatistic $routeStats, array $stageMeta): PredictionHistory
    {
        $priceInfo = $this->estimationService->resolvePrice($trip, $trip->vehicle);
        $price     = $priceInfo['price_per_liter'];

        $baseline  = $this->stageEngine->computeColdStartBaseline($trip, $distance, $price);
        $predictedFuel = $baseline['fuel_liters'];
        $predictedCost = $baseline['fuel_cost'];
        $predictedDur  = $routeStats?->avg_duration_hours ?: ($distance > 0 ? $distance / 45 : 0);
        $predictedProfit = ($routeStats?->avg_revenue ?? 0) - $predictedCost;

        $factors = array_merge($stageMeta, [
            'engine'              => 'cold_start_baseline',
            'mfg_mileage'         => $trip->vehicle?->manufacturer_mileage ?: 4.0,
            'cargo_weight'        => $trip->cargo_weight,
            'price_used'          => $price,
        ]);

        $prediction = PredictionHistory::updateOrCreate(
            ['trip_id' => $trip->id],
            [
                'predicted_distance'       => $distance,
                'predicted_fuel_liters'    => $predictedFuel,
                'predicted_fuel_cost'      => $predictedCost,
                'predicted_mileage'        => $baseline['mileage'],
                'predicted_duration_hours' => $predictedDur,
                'predicted_profit'         => $predictedProfit,
                'data_source'              => $stageMeta['data_source'],
                'learning_stage'           => $stageMeta['stage'],
                'is_synthetic'             => $trip->is_synthetic ?? false,
                'prediction_factors'       => json_encode($factors),
            ]
        );

        $trip->update([
            'prediction_id' => $prediction->id,
            'fuel_budget'   => round($predictedCost * 1.10, 2),
        ]);

        return $prediction;
    }

    private function persistFromMl(Trip $trip, array $ml, float $distance, ?RouteStatistic $routeStats, array $stageMeta): PredictionHistory
    {
        $priceInfo = $this->estimationService->resolvePrice($trip, $trip->vehicle);
        $price     = $priceInfo['price_per_liter'];

        $predictedFuel = (float) $ml['predicted_fuel_liters'];
        $predictedCost = $predictedFuel * $price;
        $ciLower       = (float) ($ml['ci_lower_liters'] ?? $predictedFuel * 0.9);
        $ciUpper       = (float) ($ml['ci_upper_liters'] ?? $predictedFuel * 1.1);
        $predictedDur  = $routeStats?->avg_duration_hours ?: ($distance > 0 ? $distance / 45 : 0);
        $predictedProfit = ($routeStats?->avg_revenue ?? 0) - $predictedCost;

        $factors = array_merge($stageMeta, [
            'engine'              => 'python_ml',
            'training_data_type'  => ($ml['model_source'] ?? '') === 'synthetic' ? 'synthetic' : 'real',
            'model_r2'            => $ml['model_r2'] ?? null,
            'model_mae'           => $ml['model_mae'] ?? null,
            'ci_lower_liters'     => $ciLower,
            'ci_upper_liters'     => $ciUpper,
            'ci_lower_cost'       => round($ciLower * $price, 2),
            'ci_upper_cost'       => round($ciUpper * $price, 2),
            'feature_importances' => $ml['feature_importances'] ?? [],
            'price_used'          => $price,
            'n_training_samples'  => $ml['n_training_samples'] ?? 0,
            'model_source'        => $ml['model_source'] ?? 'unknown',
        ]);

        $prediction = PredictionHistory::updateOrCreate(
            ['trip_id' => $trip->id],
            [
                'predicted_distance'       => $distance,
                'predicted_fuel_liters'    => $predictedFuel,
                'predicted_fuel_cost'      => $predictedCost,
                'predicted_mileage'        => $distance > 0 && $predictedFuel > 0 ? round($distance / $predictedFuel, 2) : 0,
                'predicted_duration_hours' => $predictedDur,
                'predicted_profit'         => $predictedProfit,
                'data_source'              => $stageMeta['data_source'],
                'learning_stage'           => $stageMeta['stage'],
                'is_synthetic'             => $trip->is_synthetic ?? false,
                'prediction_factors'       => json_encode($factors),
            ]
        );

        $trip->update([
            'prediction_id' => $prediction->id,
            'fuel_budget'   => round($predictedCost * 1.10, 2),
        ]);

        return $prediction;
    }

    private function persistFromEwma(Trip $trip, $vehicle, $driver, ?RouteStatistic $routeStats, float $distance, array $stageMeta): PredictionHistory
    {
        $vehicleMileage = $vehicle?->statistic?->current_learned_mileage ?: ($vehicle?->effectiveMileage() ?: 4.0);
        $driverMileage  = $driver?->statistic?->avg_mileage_kmpl ?: $vehicleMileage;
        $routeMileage   = $routeStats?->avg_mileage_kmpl ?: $vehicleMileage;

        if ($stageMeta['stage'] === StageEngine::STAGE_2_VEHICLE_EWMA) {
            $blendedMileage = $vehicleMileage;
        } else {
            // Stage 3 Blend: vehicle 40%, driver 30%, route 30%
            $blendedMileage = ($vehicleMileage * 0.4) + ($driverMileage * 0.3) + ($routeMileage * 0.3);
        }

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

        $factors = array_merge($stageMeta, [
            'engine'             => 'ewma_statistical',
            'vehicle_mileage'    => $vehicleMileage,
            'driver_mileage'     => $driverMileage,
            'route_mileage'      => $routeMileage,
            'cargo_adjustment'   => $cargoAdj,
            'price_used'         => $price,
        ]);

        $prediction = PredictionHistory::updateOrCreate(
            ['trip_id' => $trip->id],
            [
                'predicted_distance'       => $distance,
                'predicted_fuel_liters'    => $predictedFuel,
                'predicted_fuel_cost'      => $predictedCost,
                'predicted_mileage'        => round($blendedMileage, 2),
                'predicted_duration_hours' => $predictedDur,
                'predicted_profit'         => $predictedProfit,
                'data_source'              => $stageMeta['data_source'],
                'learning_stage'           => $stageMeta['stage'],
                'is_synthetic'             => $trip->is_synthetic ?? false,
                'prediction_factors'       => json_encode($factors),
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

        $actualCost    = $completedTrip->actualFuelCost();
        $predictedCost = (float) $prediction->predicted_fuel_cost;
        
        $accuracyScore = 0;
        $absoluteError = abs($predictedCost - $actualCost);
        $mapePercent   = 0;

        if ($predictedCost > 0) {
            $mapePercent   = ($absoluteError / $predictedCost) * 100;
            $accuracyScore = max(0, 100 - $mapePercent);
        }

        $prediction->update([
            'actual_distance'    => $completedTrip->actualDistance(),
            'actual_fuel_liters' => $completedTrip->actualFuelLiters(),
            'actual_fuel_cost'   => $actualCost,
            'actual_mileage'     => $completedTrip->actualMileage(),
            'accuracy_score'     => round($accuracyScore, 2),
            'mape_percent'       => round($mapePercent, 2),
            'absolute_error'     => round($absoluteError, 2),
        ]);
    }
}
