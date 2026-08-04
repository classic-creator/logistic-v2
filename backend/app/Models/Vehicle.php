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
    ];

    public function trips() { return $this->hasMany(Trip::class); }
    public function maintenanceLogs() { return $this->hasMany(VehicleMaintenanceLog::class); }
}
