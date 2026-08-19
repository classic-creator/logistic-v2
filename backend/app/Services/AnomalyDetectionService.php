<?php

namespace App\Services;

use App\Models\FuelEntry;
use App\Models\Trip;
use App\Models\Vehicle;

/**
 * Abnormal Fuel Detection.
 *
 * Flags suspicious fuel entries for human review across 11 standardized rules:
 * High Cost, Low Mileage, Duplicate Entry, Odometer Issues, Tank Capacity,
 * Frequent Fills, Theft Pattern, Repeated Fills, Odometer Rollback, Distance Mismatch, Driver Outlier.
 */
class AnomalyDetectionService
{
    public const FLAG_HIGH_COST = 'high_cost_vs_estimate';
    public const FLAG_LOW_MILEAGE = 'low_mileage';
    public const FLAG_DUPLICATE = 'duplicate_entry';
    public const FLAG_ODOMETER_BACKWARD = 'odometer_backward';
    public const FLAG_ODOMETER_JUMP = 'odometer_jump';
    public const FLAG_OVER_CAPACITY = 'quantity_over_capacity';
    public const FLAG_FREQUENT_FILL = 'frequent_fill';

    public function inspect(FuelEntry $entry): FuelEntry
    {
        $flags = [];

        if ($flag = $this->highCostVsEstimate($entry)) $flags[] = $flag;
        if ($flag = $this->lowMileage($entry)) $flags[] = $flag;
        if ($flag = $this->duplicateEntry($entry)) $flags[] = $flag;
        if ($flag = $this->odometerIssues($entry)) $flags[] = $flag;
        if ($flag = $this->overCapacity($entry)) $flags[] = $flag;
        if ($flag = $this->frequentFill($entry)) $flags[] = $flag;
        if ($flag = $this->fuelTheftPattern($entry)) $flags[] = $flag;
        if ($flag = $this->repeatedFilling($entry)) $flags[] = $flag;
        if ($flag = $this->odometerRollback($entry)) $flags[] = $flag;
        if ($flag = $this->distanceFuelMismatch($entry)) $flags[] = $flag;
        if ($flag = $this->driverOutlier($entry)) $flags[] = $flag;

        $entry->update([
            'flags' => $flags,
            'is_flagged' => count($flags) > 0,
        ]);

        return $entry->refresh();
    }

    protected function highCostVsEstimate(FuelEntry $entry): ?array
    {
        if (!$entry->trip || !$entry->total_cost) return null;
        $estCost = (float) $entry->trip->estimated_fuel_cost;
        if ($estCost <= 0) return null;

        $ratio = ((float) $entry->total_cost / $estCost) * 100;
        if ($ratio > 110) {
            return [
                'rule' => self::FLAG_HIGH_COST,
                'severity' => $ratio > 130 ? 'CRITICAL' : 'HIGH',
                'reason' => sprintf('Entry cost (₹%s) exceeds trip estimate (₹%s) by %.0f%%', number_format($entry->total_cost), number_format($estCost), $ratio - 100),
                'evidence' => sprintf('Actual: ₹%s vs Estimated: ₹%s', number_format($entry->total_cost), number_format($estCost)),
                'detected_value' => (float) $entry->total_cost,
                'expected_value' => $estCost,
                'confidence' => 90,
                'recommended_action' => 'Verify station receipt and driver odometer log before approving fuel expense.',
            ];
        }
        return null;
    }

    protected function lowMileage(FuelEntry $entry): ?array
    {
        $vehicle = $entry->vehicle;
        if (!$vehicle) return null;
        $baseline = (float) ($vehicle->statistic?->current_learned_mileage ?: $vehicle->current_avg_mileage);
        if ($baseline <= 0) return null;

        $distance = $this->segmentDistance($entry);
        if ($distance <= 0 || (float) $entry->quantity <= 0) return null;

        $mileage = $distance / (float) $entry->quantity;
        if ($mileage < $baseline * 0.6) {
            return [
                'rule' => self::FLAG_LOW_MILEAGE,
                'severity' => 'HIGH',
                'reason' => sprintf('Segment mileage %.1f km/l is >40%% below vehicle baseline (%.1f km/l)', $mileage, $baseline),
                'evidence' => sprintf('Segment Mileage: %.1f km/l vs Baseline: %.1f km/l', $mileage, $baseline),
                'detected_value' => round($mileage, 2),
                'expected_value' => round($baseline, 2),
                'confidence' => 85,
                'recommended_action' => 'Inspect vehicle engine performance and check for fuel leakage.',
            ];
        }
        return null;
    }

    protected function duplicateEntry(FuelEntry $entry): ?array
    {
        $exists = FuelEntry::query()
            ->where('trip_id', $entry->trip_id)
            ->where('id', '!=', $entry->id)
            ->where('quantity', $entry->quantity)
            ->where('station_name', $entry->station_name)
            ->where('odometer', $entry->odometer)
            ->exists();

        if ($exists) {
            return [
                'rule' => self::FLAG_DUPLICATE,
                'severity' => 'CRITICAL',
                'reason' => 'Duplicate fuel entry detected for identical trip, station, quantity and odometer.',
                'evidence' => sprintf('Duplicate Entry: %s L at %s', $entry->quantity, $entry->station_name),
                'detected_value' => $entry->quantity,
                'expected_value' => null,
                'confidence' => 95,
                'recommended_action' => 'Reject duplicate entry to prevent double billing.',
            ];
        }
        return null;
    }

    protected function odometerIssues(FuelEntry $entry): ?array
    {
        if (!$entry->odometer) return null;

        $prev = FuelEntry::query()
            ->where('vehicle_id', $entry->vehicle_id)
            ->where('id', '!=', $entry->id)
            ->where('odometer', '>', 0)
            ->orderByDesc('filled_at')
            ->first();

        if ($prev && $prev->odometer > $entry->odometer) {
            return [
                'rule' => self::FLAG_ODOMETER_BACKWARD,
                'severity' => 'CRITICAL',
                'reason' => sprintf('Odometer reading (%s km) is lower than previous reading (%s km).', number_format($entry->odometer), number_format($prev->odometer)),
                'evidence' => sprintf('Current Odo: %s km < Previous Odo: %s km', number_format($entry->odometer), number_format($prev->odometer)),
                'detected_value' => (float) $entry->odometer,
                'expected_value' => (float) $prev->odometer,
                'confidence' => 95,
                'recommended_action' => 'Request driver to re-verify odometer photograph on receipt.',
            ];
        }

        if ($prev && (float) $entry->quantity > 0) {
            $segment = $entry->odometer - $prev->odometer;
            $plausible = ($segment / (float) $entry->quantity);
            if ($segment > 0 && $plausible > 25) {
                return [
                    'rule' => self::FLAG_ODOMETER_JUMP,
                    'severity' => 'MEDIUM',
                    'reason' => sprintf('Segment implied mileage %.1f km/l is implausibly high (>25 km/l).', $plausible),
                    'evidence' => sprintf('Implied Mileage: %.1f km/l', $plausible),
                    'detected_value' => round($plausible, 2),
                    'expected_value' => 8.0,
                    'confidence' => 80,
                    'recommended_action' => 'Check whether driver missed logging an intermediate fuel refill.',
                ];
            }
        }

        return null;
    }

    protected function overCapacity(FuelEntry $entry): ?array
    {
        $vehicle = $entry->vehicle;
        if (!$vehicle) return null;
        $capacity = $vehicle->tankCapacity();
        if ((float) $entry->quantity > $capacity) {
            return [
                'rule' => self::FLAG_OVER_CAPACITY,
                'severity' => 'CRITICAL',
                'reason' => sprintf('Quantity (%.0f L) exceeds vehicle tank capacity (%.0f L).', $entry->quantity, $capacity),
                'evidence' => sprintf('Filled: %.0f L vs Tank Capacity: %.0f L', $entry->quantity, $capacity),
                'detected_value' => (float) $entry->quantity,
                'expected_value' => (float) $capacity,
                'confidence' => 95,
                'recommended_action' => 'Verify fuel receipt for quantity typos or fraud.',
            ];
        }
        return null;
    }

    protected function frequentFill(FuelEntry $entry): ?array
    {
        if (!$entry->filled_at) return null;

        $recent = FuelEntry::query()
            ->where('vehicle_id', $entry->vehicle_id)
            ->where('id', '!=', $entry->id)
            ->where('filled_at', '>=', $entry->filled_at->copy()->subHours(6))
            ->where('filled_at', '<=', $entry->filled_at->copy()->addHours(6))
            ->count();

        if ($recent >= 2) {
            return [
                'rule' => self::FLAG_FREQUENT_FILL,
                'severity' => 'MEDIUM',
                'reason' => sprintf('%d other fuel entries recorded within 6 hours of this fill.', $recent),
                'evidence' => sprintf('Fills in 6h window: %d', $recent + 1),
                'detected_value' => $recent + 1,
                'expected_value' => 1,
                'confidence' => 75,
                'recommended_action' => 'Confirm whether vehicle underwent multi-stage refueling on long route.',
            ];
        }
        return null;
    }

    protected function segmentDistance(FuelEntry $entry): float
    {
        $prev = FuelEntry::query()
            ->where('vehicle_id', $entry->vehicle_id)
            ->where('id', '!=', $entry->id)
            ->where('odometer', '>', 0)
            ->orderByDesc('filled_at')
            ->first();

        if ($prev && $entry->odometer > $prev->odometer) {
            return (float) $entry->odometer - (float) $prev->odometer;
        }
        return 0;
    }

    protected function fuelTheftPattern(FuelEntry $entry): ?array
    {
        $trips = Trip::where('vehicle_id', $entry->vehicle_id)->latest()->take(5)->get();
        $negativeVarianceCount = 0;
        
        foreach ($trips as $trip) {
            if ($trip->fuel_variance_percent > 15) {
                $negativeVarianceCount++;
            }
        }
        
        if ($negativeVarianceCount >= 4) {
            return [
                'rule' => 'fuel_theft_pattern',
                'severity' => 'HIGH',
                'reason' => 'Vehicle consistently exhibits >15% negative fuel variance over recent trips.',
                'evidence' => sprintf('Abnormal variance trips: %d out of 5', $negativeVarianceCount),
                'detected_value' => $negativeVarianceCount,
                'expected_value' => 0,
                'confidence' => 85,
                'recommended_action' => 'Initiate operational audit for potential fuel theft or siphoning.',
            ];
        }
        
        return null;
    }

    protected function repeatedFilling(FuelEntry $entry): ?array
    {
        if (!$entry->filled_at) return null;
        
        $repeated = FuelEntry::query()
            ->where('vehicle_id', $entry->vehicle_id)
            ->where('id', '!=', $entry->id)
            ->where('station_name', $entry->station_name)
            ->whereBetween('quantity', [$entry->quantity * 0.9, $entry->quantity * 1.1])
            ->whereBetween('filled_at', [$entry->filled_at->copy()->subHours(2), $entry->filled_at->copy()->addHours(2)])
            ->exists();
            
        if ($repeated) {
            return [
                'rule' => 'repeated_filling',
                'severity' => 'CRITICAL',
                'reason' => 'Same petrol station and similar quantity filled within 2 hours.',
                'evidence' => sprintf('Station: %s, Quantity ~%.1f L within 2 hours', $entry->station_name, $entry->quantity),
                'detected_value' => $entry->quantity,
                'expected_value' => null,
                'confidence' => 90,
                'recommended_action' => 'Verify fuel card transaction statement for duplicate swipe.',
            ];
        }
        
        return null;
    }

    protected function odometerRollback(FuelEntry $entry): ?array
    {
        if (!$entry->odometer) return null;
        
        $prev = FuelEntry::query()
            ->where('vehicle_id', $entry->vehicle_id)
            ->where('id', '!=', $entry->id)
            ->where('odometer', '>', 0)
            ->orderByDesc('filled_at')
            ->first();
            
        if ($prev && $entry->odometer < $prev->odometer) {
            return [
                'rule' => 'odometer_rollback',
                'severity' => 'CRITICAL',
                'reason' => 'Odometer reading is lower than previous recorded entry.',
                'evidence' => sprintf('Current: %s vs Previous: %s', number_format($entry->odometer), number_format($prev->odometer)),
                'detected_value' => (float) $entry->odometer,
                'expected_value' => (float) $prev->odometer,
                'confidence' => 95,
                'recommended_action' => 'Inspect odometer meter tampering or data entry typo.',
            ];
        }
        
        return null;
    }

    protected function distanceFuelMismatch(FuelEntry $entry): ?array
    {
        $trip = $entry->trip;
        $vehicle = $entry->vehicle;
        
        if (!$trip || !$vehicle || !$trip->actual_distance || !$entry->quantity) return null;
        
        $learnedMileage = $vehicle->statistic?->current_learned_mileage ?: $vehicle->effectiveMileage();
        if ($learnedMileage <= 0) return null;
        
        $impliedMileage = $trip->actual_distance / $entry->quantity;
        
        if ($impliedMileage < ($learnedMileage * 0.5)) {
            return [
                'rule' => 'distance_fuel_mismatch',
                'severity' => 'HIGH',
                'reason' => 'Implied trip mileage is <50% of vehicle learned baseline.',
                'evidence' => sprintf('Implied: %.1f km/l vs Baseline: %.1f km/l', $impliedMileage, $learnedMileage),
                'detected_value' => round($impliedMileage, 2),
                'expected_value' => round($learnedMileage, 2),
                'confidence' => 85,
                'recommended_action' => 'Verify route distance and trip log details.',
            ];
        }
        
        return null;
    }

    protected function driverOutlier(FuelEntry $entry): ?array
    {
        $driver = $entry->driver;
        if (!$driver || !$driver->statistic || !$entry->trip || !$entry->trip->actual_distance || !$entry->quantity) return null;
        
        $meanMileage = $driver->statistic->avg_mileage_kmpl;
        if ($meanMileage <= 0) return null;
        
        $impliedMileage = $entry->trip->actual_distance / $entry->quantity;
        
        if ($impliedMileage < ($meanMileage * 0.5)) {
            return [
                'rule' => 'driver_outlier',
                'severity' => 'MEDIUM',
                'reason' => 'Fuel consumption rate is significantly higher than driver\'s historical average.',
                'evidence' => sprintf('Trip Mileage: %.1f km/l vs Driver Avg: %.1f km/l', $impliedMileage, $meanMileage),
                'detected_value' => round($impliedMileage, 2),
                'expected_value' => round($meanMileage, 2),
                'confidence' => 80,
                'recommended_action' => 'Provide driving efficiency feedback to driver.',
            ];
        }
        
        return null;
    }
}
