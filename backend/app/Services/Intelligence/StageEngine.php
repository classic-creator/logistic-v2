<?php

namespace App\Services\Intelligence;

use App\Models\Trip;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\FuelEntry;
use App\Models\RouteStatistic;

/**
 * StageEngine — Progressive Learning & Cold-Start Classification
 * =============================================================
 * Automatically evaluates entity historical data volume to determine appropriate
 * calculation stage and non-misleading AI labels:
 *
 * Stage 1: 0 Real Trips        -> STAGE_1_BASELINE     ("Baseline Estimate", 50% confidence)
 * Stage 2: 1-5 Real Trips      -> STAGE_2_VEHICLE_EWMA ("Historical Estimate", 65% confidence)
 * Stage 3: 6-29 Real Trips     -> STAGE_3_MULTI_FACTOR ("Historical Estimate", 80% confidence)
 * Stage 4: >=30 Real Trips     -> STAGE_4_ML_PREDICTION("ML Prediction", >=88% confidence)
 */
class StageEngine
{
    public const STAGE_1_BASELINE     = 1;
    public const STAGE_2_VEHICLE_EWMA = 2;
    public const STAGE_3_MULTI_FACTOR = 3;
    public const STAGE_4_ML_PREDICTION = 4;

    public const ML_ACTIVATION_THRESHOLD = 30;

    /**
     * Evaluate the learning stage for a specific trip based on real valid data points.
     */
    public function evaluateStage(Trip $trip): array
    {
        $vehicle = $trip->vehicle;
        
        // Count valid, non-synthetic, approved trips for this vehicle
        $validTripsCount = 0;
        if ($vehicle) {
            $validTripsCount = Trip::where('vehicle_id', $vehicle->id)
                ->where('status', 'Completed')
                ->where('is_synthetic', false)
                ->whereHas('fuelEntries', function ($q) {
                    $q->where('status', FuelEntry::STATUS_APPROVED)
                      ->where('is_synthetic', false);
                })->count();
        }

        $isSyntheticTrip = (bool) ($trip->is_synthetic ?? false);

        if ($validTripsCount >= self::ML_ACTIVATION_THRESHOLD && !$isSyntheticTrip) {
            $stage = self::STAGE_4_ML_PREDICTION;
            $label = 'ML Prediction';
            $confidence = 90;
            $method = 'HistGradientBoostingRegressor ML Model';
            $dataSource = 'REAL';
        } elseif ($validTripsCount >= 6) {
            $stage = self::STAGE_3_MULTI_FACTOR;
            $label = 'Historical Estimate';
            $confidence = 80;
            $method = 'Vehicle + Driver + Route Multi-Factor EWMA';
            $dataSource = $isSyntheticTrip ? 'SYNTHETIC' : 'REAL';
        } elseif ($validTripsCount >= 1) {
            $stage = self::STAGE_2_VEHICLE_EWMA;
            $label = 'Historical Estimate';
            $confidence = 65;
            $method = 'Vehicle Historical EWMA';
            $dataSource = $isSyntheticTrip ? 'SYNTHETIC' : 'REAL';
        } else {
            $stage = self::STAGE_1_BASELINE;
            $label = 'Baseline Estimate';
            $confidence = 50;
            $method = 'Manufacturer Specs & Cold-Start Baseline';
            $dataSource = $isSyntheticTrip ? 'SYNTHETIC' : 'BASELINE';
        }

        return [
            'stage' => $stage,
            'display_label' => $label,
            'confidence_percent' => $confidence,
            'method_used' => $method,
            'data_source' => $dataSource,
            'valid_trips_count' => $validTripsCount,
            'ml_ready' => $validTripsCount >= self::ML_ACTIVATION_THRESHOLD,
            'ml_threshold' => self::ML_ACTIVATION_THRESHOLD,
            'notice' => $validTripsCount < self::ML_ACTIVATION_THRESHOLD ? 'Limited historical data (Cold-Start Stage ' . $stage . ')' : null,
        ];
    }

    /**
     * Compute conservative cold-start baseline fuel estimation for Stage 1.
     */
    public function computeColdStartBaseline(Trip $trip, float $distance, float $pricePerLiter): array
    {
        $vehicle = $trip->vehicle;
        $mfgMileage = max(0.1, (float) ($vehicle?->manufacturer_mileage ?: 4.0));

        // Vehicle type baseline adjustments
        $vehicleType = strtolower($vehicle?->type ?? 'truck');
        if (str_contains($vehicleType, 'trailer') || str_contains($vehicleType, 'heavy')) {
            $mfgMileage = min($mfgMileage, 3.2);
        } elseif (str_contains($vehicleType, 'pickup') || str_contains($vehicleType, 'van')) {
            $mfgMileage = max($mfgMileage, 8.0);
        }

        // Cargo load factor adjustment (up to 15% reduction in mileage for 100% capacity load)
        $cargoWeight = (float) ($trip->cargo_weight ?? 0);
        $capacity = max(1, (float) ($vehicle?->capacity ?? 10000));
        $loadRatio = min(1.0, $cargoWeight / $capacity);
        $effectiveMileage = max(0.1, $mfgMileage / (1.0 + ($loadRatio * 0.15)));

        $fuelLiters = $distance > 0 ? round($distance / $effectiveMileage, 2) : 0;
        $fuelCost = round($fuelLiters * $pricePerLiter, 2);

        return [
            'distance' => round($distance, 2),
            'mileage' => round($effectiveMileage, 2),
            'fuel_liters' => $fuelLiters,
            'fuel_cost' => $fuelCost,
            'price_per_liter' => $pricePerLiter,
        ];
    }
}
