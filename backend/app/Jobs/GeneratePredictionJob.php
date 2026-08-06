<?php

namespace App\Jobs;

use App\Models\Trip;
use App\Models\RecommendationHistory;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\Intelligence\PredictionEngine;
use App\Services\Intelligence\RecommendationEngine;

class GeneratePredictionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public Trip $trip;

    public function __construct(Trip $trip)
    {
        $this->trip = $trip;
    }

    public function handle(PredictionEngine $predictionEngine, RecommendationEngine $recommendationEngine): void
    {
        $predictionEngine->predictTrip($this->trip);

        if ($this->trip->pickup_location && $this->trip->destination) {
            $vehicleRecs = $recommendationEngine->recommendVehicle(
                $this->trip->pickup_location, 
                $this->trip->destination, 
                $this->trip->cargo_weight
            );
            
            if (!empty($vehicleRecs)) {
                RecommendationHistory::create([
                    'trip_id' => $this->trip->id,
                    'type' => 'vehicle',
                    'recommendation' => json_encode($vehicleRecs),
                    'confidence_percent' => $vehicleRecs[0]['confidence_percent'] ?? 50,
                ]);
            }

            $driverRecs = $recommendationEngine->recommendDriver(
                $this->trip->pickup_location, 
                $this->trip->destination, 
                $this->trip->vehicle_id
            );
            
            if (!empty($driverRecs)) {
                RecommendationHistory::create([
                    'trip_id' => $this->trip->id,
                    'type' => 'driver',
                    'recommendation' => json_encode($driverRecs),
                    'confidence_percent' => $driverRecs[0]['confidence_percent'] ?? 50,
                ]);
            }
        }
        
        $recommendationEngine->recommendFuelBudget($this->trip);
    }
}
