<?php

namespace App\Services\Intelligence;

use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Trip;
use App\Models\VehicleStatistic;
use App\Models\LearningHistory;

class LearningEngine
{
    public const DECAY_FACTOR = 0.85;

    public function learnVehicleMileage(Vehicle $vehicle, ?Trip $triggerTrip = null): float
    {
        $trips = Trip::where('vehicle_id', $vehicle->id)
            ->where('status', 'Completed')
            ->orderBy('end_date', 'desc')
            ->get();
            
        $dataPoints = 0;
        $numerator = 0;
        $denominator = 0;
        
        foreach ($trips as $i => $trip) {
            $dist = $trip->actualDistance();
            $liters = $trip->actualFuelLiters();
            if ($dist <= 0 || $liters <= 0) continue;
            
            $mileage = $dist / $liters;
            $weight = pow(self::DECAY_FACTOR, $i);
            
            $numerator += $mileage * $weight;
            $denominator += $weight;
            $dataPoints++;
        }
        
        $learnedMileage = $denominator > 0 ? $numerator / $denominator : 0;
        $manufacturerMileage = (float) $vehicle->manufacturer_mileage;
        if ($manufacturerMileage <= 0) $manufacturerMileage = 4.0;
        
        if ($dataPoints < 3) {
            $learnedMileage = ($manufacturerMileage * (3 - $dataPoints) / 3) + ($learnedMileage * $dataPoints / 3);
        }
        
        $confidence = min(1.0, $dataPoints / 20);
        $previousMileage = $vehicle->statistic?->current_learned_mileage ?? $manufacturerMileage;
        
        LearningHistory::create([
            'entity_type' => Vehicle::class,
            'entity_id' => $vehicle->id,
            'previous_mileage' => $previousMileage,
            'new_mileage' => $learnedMileage,
            'confidence_score' => $confidence,
            'data_points_used' => $dataPoints,
            'weight_decay_factor' => self::DECAY_FACTOR,
            'trigger' => $triggerTrip ? 'trip_completed' : 'manual',
            'trip_id' => $triggerTrip?->id,
        ]);
        
        VehicleStatistic::updateOrCreate(
            ['vehicle_id' => $vehicle->id],
            [
                'current_learned_mileage' => $learnedMileage,
                'confidence_score' => $confidence,
            ]
        );
        
        return $learnedMileage;
    }

    public function learnDriverEfficiency(Driver $driver, ?Trip $triggerTrip = null): float
    {
        $trips = Trip::where('driver_id', $driver->id)
            ->where('status', 'Completed')
            ->orderBy('end_date', 'desc')
            ->get();
            
        $dataPoints = 0;
        $numerator = 0;
        $denominator = 0;
        
        foreach ($trips as $i => $trip) {
            $dist = $trip->actualDistance();
            $liters = $trip->actualFuelLiters();
            if ($dist <= 0 || $liters <= 0) continue;
            
            $mileage = $dist / $liters;
            $weight = pow(self::DECAY_FACTOR, $i);
            
            $numerator += $mileage * $weight;
            $denominator += $weight;
            $dataPoints++;
        }
        
        $learnedMileage = $denominator > 0 ? $numerator / $denominator : 4.0;
        $confidence = min(1.0, $dataPoints / 20);
        
        LearningHistory::create([
            'entity_type' => Driver::class,
            'entity_id' => $driver->id,
            'previous_mileage' => 0, // Simplified
            'new_mileage' => $learnedMileage,
            'confidence_score' => $confidence,
            'data_points_used' => $dataPoints,
            'weight_decay_factor' => self::DECAY_FACTOR,
            'trigger' => $triggerTrip ? 'trip_completed' : 'manual',
            'trip_id' => $triggerTrip?->id,
        ]);
        
        return $learnedMileage;
    }

    public function learnRouteMileage(string $pickup, string $destination): float
    {
        $trips = Trip::where('pickup_location', $pickup)
            ->where('destination', $destination)
            ->where('status', 'Completed')
            ->orderBy('end_date', 'desc')
            ->get();
            
        $dataPoints = 0;
        $numerator = 0;
        $denominator = 0;
        
        foreach ($trips as $i => $trip) {
            $dist = $trip->actualDistance();
            $liters = $trip->actualFuelLiters();
            if ($dist <= 0 || $liters <= 0) continue;
            
            $mileage = $dist / $liters;
            $weight = pow(self::DECAY_FACTOR, $i);
            
            $numerator += $mileage * $weight;
            $denominator += $weight;
            $dataPoints++;
        }
        
        $learnedMileage = $denominator > 0 ? $numerator / $denominator : 4.0;
        
        // Save history logic could be added for routes (omitted for brevity, using string keys typically)
        
        return $learnedMileage;
    }

    public function getConfidenceScore(string $entityType, int $entityId): float
    {
        $latest = LearningHistory::where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->latest()
            ->first();
            
        return $latest ? (float) $latest->confidence_score : 0.0;
    }

    public function getMileageTrend(string $entityType, int $entityId, int $periods = 10): array
    {
        return LearningHistory::where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->latest()
            ->take($periods)
            ->get()
            ->map(fn($h) => [
                'date' => $h->created_at->toDateTimeString(),
                'mileage' => $h->new_mileage,
                'confidence' => $h->confidence_score,
            ])
            ->reverse()
            ->values()
            ->toArray();
    }
}
