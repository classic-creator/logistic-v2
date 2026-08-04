<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Driver extends Model
{
    use HasFactory, SoftDeletes;
    protected $guarded = [];
    
    protected $casts = [
        'license_expiry_date' => 'date',
    ];

    public function trips() { return $this->hasMany(Trip::class); }
    public function assignedVehicle() { return $this->belongsTo(Vehicle::class, 'assigned_vehicle_id'); }
}
