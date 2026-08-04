<?php

namespace App\Services;

use App\Models\FuelEntry;
use App\Models\Trip;
use App\Models\Vehicle;

/**
 * Abnormal Fuel Detection.
 *
 * Flags suspicious fuel entries for human review. Detection rules:
 *  - Cost significantly higher than the trip estimate
 *  - Mileage far below the vehicle historical average
 *  - Duplicate entries (same trip, station, quantity, odometer)
 *  - Odometer that goes backwards or leaps impossibly between fills
 *  - Quantity exceeding tank capacity
 *  - Multiple fills inside an unrealistically short timeframe
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
                'message' => sprintf('Entry cost (₹%s) exceeds the trip fuel estimate (₹%s) by %.0f%%', number_format($entry->total_cost), number_format($estCost), $ratio - 100),
                'severity' => $ratio > 130 ? 'critical' : 'warning',
            ];
        }
        return null;
    }

    protected function lowMileage(FuelEntry $entry): ?array
    {
        $vehicle = $entry->vehicle;
        if (!$vehicle) return null;
        $baseline = (float) $vehicle->current_avg_mileage;
        if ($baseline <= 0) return null;

        $distance = $this->segmentDistance($entry);
        if ($distance <= 0 || (float) $entry->quantity <= 0) return null;

        $mileage = $distance / (float) $entry->quantity;
        if ($mileage < $baseline * 0.6) {
            return [
                'rule' => self::FLAG_LOW_MILEAGE,
                'message' => sprintf('Segment mileage %.1f km/l is more than 40%% below the vehicle average (%.1f km/l)', $mileage, $baseline),
                'severity' => 'warning',
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
                'message' => 'Duplicate entry detected for the same trip, station, quantity and odometer.',
                'severity' => 'critical',
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
                'message' => sprintf('Odometer (%s) is lower than the previous reading (%s).', $entry->odometer, $prev->odometer),
                'severity' => 'critical',
            ];
        }

        if ($prev && (float) $entry->quantity > 0) {
            $segment = $entry->odometer - $prev->odometer;
            $plausible = ($segment / (float) $entry->quantity);
            if ($segment > 0 && $plausible > 25) {
                return [
                    'rule' => self::FLAG_ODOMETER_JUMP,
                    'message' => sprintf('Segment mileage %.1f km/l is implausibly high — odometer may be incorrect.', $plausible),
                    'severity' => 'warning',
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
                'message' => sprintf('Quantity (%.0f L) exceeds the vehicle tank capacity (%.0f L).', $entry->quantity, $capacity),
                'severity' => 'critical',
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
                'message' => sprintf('%d other fuel entries recorded within 6 hours of this one.', $recent),
                'severity' => 'warning',
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
}
