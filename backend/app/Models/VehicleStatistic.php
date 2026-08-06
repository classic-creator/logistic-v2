<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleStatistic extends Model
{
    use HasFactory;

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'total_distance_km' => 'float',
        'total_fuel_liters' => 'float',
        'total_fuel_cost' => 'float',
        'avg_mileage_kmpl' => 'float',
        'loaded_mileage' => 'float',
        'empty_mileage' => 'float',
        'highway_mileage' => 'float',
        'city_mileage' => 'float',
        'manufacturer_mileage' => 'float',
        'current_learned_mileage' => 'float',
        'lifetime_running_hours' => 'float',
        'confidence_score' => 'float',
        'last_calculated_at' => 'datetime',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
