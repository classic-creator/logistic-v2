<?php

namespace App\Services\Intelligence;

use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Trip;
use App\Models\VehicleStatistic;
use App\Models\LearningHistory;
use App\Models\FuelEntry;

class LearningEngine
{
    public const DECAY_FACTOR = 0.85;

    public function learnVehicleMileage(Vehicle $vehicle, ?Trip $triggerTrip = null): float
    {
        // STRICT SYNTHETIC ISOLATION: Exclude synthetic data from production EWMA learning
        $trips = Trip::where('vehicle_id', $vehicle->id)
            ->where('status', 'Completed')
            ->where('is_synthetic', false)
            ->whereHas('fuelEntries', function ($q) {
                $q->where('status', FuelEntry::STATUS_APPROVED)
                  ->where('is_synthetic', false);
            })
            ->orderBy('end_date', 'desc')
            ->get();
            
        $dataPoints = 0;
        $numerator = 0;
        $denominator = 0;
        
        foreach ($trips as $i => $trip) {
            $dist = $trip->actualDistance();
            $approvedEntries = $trip->fuelEntries()
                ->where('status', FuelEntry::STATUS_APPROVED)
                ->where('is_synthetic', false)
                ->get();
            $liters = (float) $approvedEntries->sum('quantity');
            
            if ($dist <= 0 || $liters <= 0) continue;
            
            $mileage = $dist / $liters;
            
            // Exclude extreme physical outliers (< 1 km/L or > 25 km/L)
            if ($mileage < 1.0 || $mileage > 25.0) continue;

            $weight = pow(self::DECAY_FACTOR, $i);
            
            $numerator += $mileage * $weight;
            $denominator += $weight;
            $dataPoints++;
        }
        
        $learnedMileage = $denominator > 0 ? round($numerator / $denominator, 2) : 0;
        $manufacturerMileage = (float) $vehicle->manufacturer_mileage;
        if ($manufacturerMileage <= 0) $manufacturerMileage = 4.0;
        
        if ($dataPoints < 3) {
            $learnedMileage = round(($manufacturerMileage * (3 - $dataPoints) / 3) + ($learnedMileage * $dataPoints / 3), 2);
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
        
        $learningStage = $dataPoints >= 30 ? 4 : ($dataPoints >= 6 ? 3 : ($dataPoints >= 1 ? 2 : 1));
        $dataSource = $dataPoints > 0 ? 'REAL' : 'BASELINE';

        VehicleStatistic::updateOrCreate(
            ['vehicle_id' => $vehicle->id],
            [
                'current_learned_mileage' => $learnedMileage,
                'avg_mileage_kmpl' => $learnedMileage,
                'confidence_score' => $confidence,
                'valid_trips_count' => $dataPoints,
                'real_trips_count' => $trips->count(),
                'learning_stage' => $learningStage,
                'data_source' => $dataSource,
                'ml_ready' => $dataPoints >= 30,
            ]
        );
        
        return $learnedMileage;
    }

    public function learnDriverEfficiency(Driver $driver, ?Trip $triggerTrip = null): float
    {
        $trips = Trip::where('driver_id', $driver->id)
            ->where('status', 'Completed')
            ->where('is_synthetic', false)
            ->whereHas('fuelEntries', function ($q) {
                $q->where('status', FuelEntry::STATUS_APPROVED)
                  ->where('is_synthetic', false);
            })
            ->orderBy('end_date', 'desc')
            ->get();
            
        $dataPoints = 0;
        $numerator = 0;
        $denominator = 0;
        
        foreach ($trips as $i => $trip) {
            $dist = $trip->actualDistance();
            $approvedEntries = $trip->fuelEntries()
                ->where('status', FuelEntry::STATUS_APPROVED)
                ->where('is_synthetic', false)
                ->get();
            $liters = (float) $approvedEntries->sum('quantity');
            
            if ($dist <= 0 || $liters <= 0) continue;
            
            $mileage = $dist / $liters;
            if ($mileage < 1.0 || $mileage > 25.0) continue;

            $weight = pow(self::DECAY_FACTOR, $i);
            
            $numerator += $mileage * $weight;
            $denominator += $weight;
            $dataPoints++;
        }
        
        $learnedMileage = $denominator > 0 ? round($numerator / $denominator, 2) : 4.0;
        $confidence = min(1.0, $dataPoints / 20);
        
        LearningHistory::create([
            'entity_type' => Driver::class,
            'entity_id' => $driver->id,
            'previous_mileage' => 0,
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
            ->where('is_synthetic', false)
            ->whereHas('fuelEntries', function ($q) {
                $q->where('status', FuelEntry::STATUS_APPROVED)
                  ->where('is_synthetic', false);
            })
            ->orderBy('end_date', 'desc')
            ->get();
            
        $dataPoints = 0;
        $numerator = 0;
        $denominator = 0;
        
        foreach ($trips as $i => $trip) {
            $dist = $trip->actualDistance();
            $approvedEntries = $trip->fuelEntries()
                ->where('status', FuelEntry::STATUS_APPROVED)
                ->where('is_synthetic', false)
                ->get();
            $liters = (float) $approvedEntries->sum('quantity');
            
            if ($dist <= 0 || $liters <= 0) continue;
            
            $mileage = $dist / $liters;
            if ($mileage < 1.0 || $mileage > 25.0) continue;

            $weight = pow(self::DECAY_FACTOR, $i);
            
            $numerator += $mileage * $weight;
            $denominator += $weight;
            $dataPoints++;
        }
        
        return $denominator > 0 ? round($numerator / $denominator, 2) : 4.0;
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
