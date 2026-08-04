<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use HasFactory, SoftDeletes;
    protected $guarded = [];

    protected $casts = [
        'fitness_expiry_date' => 'date',
        'pollution_expiry_date' => 'date',
        'manufacturer_mileage' => 'float',
        'highway_mileage' => 'float',
        'city_mileage' => 'float',
        'loaded_mileage' => 'float',
        'empty_mileage' => 'float',
        'current_avg_mileage' => 'float',
        'tank_capacity' => 'float',
        'last_odometer' => 'float',
    ];

    public function trips() { return $this->hasMany(Trip::class); }
    public function maintenanceLogs() { return $this->hasMany(VehicleMaintenanceLog::class); }
    public function fuelEntries() { return $this->hasMany(FuelEntry::class); }

    /**
     * The mileage figure the estimation engine should trust first.
     * Historical/current average wins, then loaded/empty context, then manufacturer.
     */
    public function effectiveMileage(): float
    {
        if ($this->current_avg_mileage && (float) $this->current_avg_mileage > 0) {
            return (float) $this->current_avg_mileage;
        }
        if ($this->loaded_mileage && (float) $this->loaded_mileage > 0) {
            return (float) $this->loaded_mileage;
        }
        if ($this->manufacturer_mileage && (float) $this->manufacturer_mileage > 0) {
            return (float) $this->manufacturer_mileage;
        }
        return 4.0; // conservative default km/l for loaded commercial vehicles
    }

    public function tankCapacity(): float
    {
        return (float) ($this->tank_capacity ?: 300);
    }
}
