<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Jobs\RecalculateStatisticsJob;

class FuelEntry extends Model
{
    use HasFactory, SoftDeletes;
    protected $guarded = [];

    protected static function booted()
    {
        static::saved(function ($fuelEntry) {
            if ($fuelEntry->vehicle) {
                $fuelEntry->vehicle->updateLastOdometerFromHistory();
            }
            
            if ($fuelEntry->isDirty('status') && $fuelEntry->status === self::STATUS_APPROVED && $fuelEntry->trip && $fuelEntry->trip->status === 'Completed') {
                RecalculateStatisticsJob::dispatch($fuelEntry->trip);
            }
        });

        static::deleted(function ($fuelEntry) {
            if ($fuelEntry->vehicle) {
                $fuelEntry->vehicle->updateLastOdometerFromHistory();
            }
        });
    }

    protected $casts = [
        'quantity' => 'float',
        'unit_price' => 'float',
        'total_cost' => 'float',
        'odometer' => 'float',
        'latitude' => 'float',
        'longitude' => 'float',
        'filled_at' => 'datetime',
        'approved_at' => 'datetime',
        'is_flagged' => 'boolean',
        'flags' => 'array',
    ];

    const STATUS_PENDING = 'Pending';
    const STATUS_APPROVED = 'Approved';
    const STATUS_REJECTED = 'Rejected';

    public function trip() { return $this->belongsTo(Trip::class); }
    public function company() { return $this->belongsTo(Company::class); }
    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function driver() { return $this->belongsTo(Driver::class); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }
}
