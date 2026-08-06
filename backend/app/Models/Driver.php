<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\DriverStatistic;

class Driver extends Model
{
    use HasFactory, SoftDeletes;
    protected $guarded = [];
    
    protected $casts = [
        'license_expiry_date' => 'date',
    ];

    public function trips() { return $this->hasMany(Trip::class); }
    public function assignedVehicle() { return $this->belongsTo(Vehicle::class, 'assigned_vehicle_id'); }
    public function fuelEntries() { return $this->hasMany(FuelEntry::class); }
    public function statistic() { return $this->hasOne(DriverStatistic::class); }
}
