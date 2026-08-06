<?php

namespace App\Services\Intelligence;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Trip;

/**
 * PythonMlService
 * ===============
 * Bridges Laravel with the FastAPI ML microservice running on port 8001.
 *
 * - Sends trip feature vectors to the Python HistGradientBoostingRegressor model.
 * - Returns point predictions, 90% confidence interval bounds, and feature importance weights.
 * - Falls back gracefully to the statistical EWMA estimator if the ML service is unreachable.
 */
class PythonMlService
{
    protected string $baseUrl;
    protected int    $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.ml_engine.url', 'http://localhost:8001');
        $this->timeout = config('services.ml_engine.timeout', 5);
    }

    /**
     * Predict fuel consumption for a trip using the ML engine.
     *
     * Returns an array with:
     *   predicted_fuel_liters, ci_lower_liters, ci_upper_liters,
     *   feature_importances, model_r2, model_mae, ml_available (bool)
     */
    public function predict(Trip $trip): array
    {
        $payload = $this->buildPayload($trip);

        try {
            $response = Http::timeout($this->timeout)
                ->post("{$this->baseUrl}/predict-fuel", $payload);

            if ($response->successful()) {
                $data = $response->json();
                return array_merge($data, ['ml_available' => true]);
            }

            Log::warning('ML engine returned non-200', ['status' => $response->status()]);
        } catch (\Throwable $e) {
            Log::info('ML engine unreachable, using EWMA fallback', ['error' => $e->getMessage()]);
        }

        return ['ml_available' => false];
    }

    /**
     * Trigger model retraining on the ML service.
     *
     * @param  array  $trips  Array of trip records with actual_fuel_liters
     */
    public function retrain(array $trips): array
    {
        try {
            $response = Http::timeout(120)
                ->post("{$this->baseUrl}/retrain", ['trips' => $trips]);

            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Throwable $e) {
            Log::error('ML retrain failed', ['error' => $e->getMessage()]);
        }

        return ['success' => false, 'error' => 'ML service unreachable'];
    }

    /**
     * Fetch current model metadata (R², MAE, feature importances, training date).
     */
    public function modelStatus(): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->baseUrl}/model-status");

            if ($response->successful()) {
                return array_merge($response->json(), ['ml_available' => true]);
            }
        } catch (\Throwable $e) {
            // silently fail
        }

        return ['ml_available' => false];
    }

    /**
     * Check if the ML engine is running.
     */
    public function isHealthy(): bool
    {
        try {
            $response = Http::timeout(2)->get("{$this->baseUrl}/health");
            return $response->successful();
        } catch (\Throwable $e) {
            return false;
        }
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    protected function buildPayload(Trip $trip): array
    {
        $vehicle = $trip->vehicle;
        $driver  = $trip->driver;

        $distance        = (float) ($trip->distance ?? $trip->order?->route_distance_km ?? $trip->estimated_distance ?? 0);
        $cargoWeight     = (float) ($trip->cargo_weight ?? 0);
        $vehicleCapacity = (float) ($vehicle?->capacity ?? 10000);
        $driverScore     = (float) ($driver?->statistic?->driving_efficiency_score ?? 75);
        $vehicleAgeKm    = (float) ($vehicle?->last_odometer ?? 50000);
        $vehicleType     = strtolower($vehicle?->type ?? 'truck');
        $terrain         = strtolower($trip->order?->route_terrain ?? 'mixed');
        $traffic         = strtolower($trip->order?->traffic_type ?? 'mixed');
        $temp            = (float) ($trip->ambient_temp_celsius ?? 28);

        return [
            'distance_km'      => $distance,
            'cargo_weight'     => $cargoWeight,
            'vehicle_capacity' => $vehicleCapacity,
            'driver_score'     => $driverScore,
            'vehicle_age_km'   => $vehicleAgeKm,
            'vehicle_type'     => $vehicleType,
            'route_terrain'    => $terrain,
            'traffic_index'    => $traffic,
            'temp_celsius'     => $temp,
        ];
    }
}
