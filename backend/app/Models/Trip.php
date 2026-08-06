<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\PredictionHistory;
use App\Jobs\GeneratePredictionJob;
use App\Jobs\RecalculateStatisticsJob;

class Trip extends Model
{
    use HasFactory, SoftDeletes;
    protected $guarded = [];

    protected static function booted()
    {
        static::saved(function ($trip) {
            if ($trip->vehicle) {
                $trip->vehicle->updateLastOdometerFromHistory();
            }
        });

        static::deleted(function ($trip) {
            if ($trip->vehicle) {
                $trip->vehicle->updateLastOdometerFromHistory();
            }
        });

        static::created(function ($trip) {
            GeneratePredictionJob::dispatch($trip);
        });

        static::updated(function ($trip) {
            if ($trip->isDirty('status') && $trip->status === 'Completed') {
                RecalculateStatisticsJob::dispatch($trip);
            }
        });
    }

    protected $casts = [
        'pickup_date' => 'date',
        'delivery_date' => 'date',
        'is_delayed' => 'boolean',
        'last_tracked_at' => 'datetime',
        'estimated_distance' => 'float',
        'estimated_fuel_liters' => 'float',
        'estimated_fuel_cost' => 'float',
        'estimated_mileage' => 'float',
        'estimated_travel_hours' => 'float',
        'start_odometer' => 'float',
        'end_odometer' => 'float',
        'fuel_price_per_liter' => 'float',
        'actual_fuel_liters' => 'float',
        'actual_fuel_cost' => 'float',
        'actual_mileage' => 'float',
    ];

    public function order() { return $this->belongsTo(Order::class); }
    public function company() { return $this->belongsTo(Company::class); }
    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function driver() { return $this->belongsTo(Driver::class); }
    public function statusHistories() { return $this->hasMany(TripStatusHistory::class); }
    public function trackingPoints() { return $this->hasMany(TripTrackingPoint::class); }
    public function documents() { return $this->hasMany(TripDocument::class); }
    public function financeLedger() { return $this->hasOne(FinanceLedger::class); }
    public function fuelEntries() { return $this->hasMany(FuelEntry::class); }
    public function fuelPrice() { return $this->belongsTo(FuelPrice::class); }
    public function prediction() { return $this->belongsTo(PredictionHistory::class, 'prediction_id'); }

    /**
     * Approved fuel quantity/cost for this trip.
     */
    public function approvedFuelEntries()
    {
        return $this->fuelEntries()->where('status', FuelEntry::STATUS_APPROVED);
    }

    public function actualDistance(): float
    {
        if ($this->start_odometer && $this->end_odometer) {
            return max(0, (float) $this->end_odometer - (float) $this->start_odometer);
        }
        return (float) ($this->distance ?? 0);
    }

    public function actualFuelLiters(): float
    {
        return (float) $this->approvedFuelEntries()->sum('quantity');
    }

    public function actualFuelCost(): float
    {
        return (float) $this->approvedFuelEntries()->sum('total_cost');
    }

    public function actualMileage(): float
    {
        $liters = $this->actualFuelLiters();
        $dist = $this->actualDistance();
        if ($liters <= 0 || $dist <= 0) return 0;
        return round($dist / $liters, 2);
    }

    public function fuelVarianceStatus(): string
    {
        $est = (float) $this->estimated_fuel_liters;
        $act = $this->actualFuelLiters();
        if ($est <= 0) return 'pending';
        $diff = (($act - $est) / $est) * 100;
        if ($diff <= 5) return 'normal';
        if ($diff <= 15) return 'elevated';
        return 'abnormal';
    }
}
