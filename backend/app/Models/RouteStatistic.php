<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RouteStatistic extends Model
{
    use HasFactory;

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'avg_distance_km' => 'float',
        'avg_fuel_liters' => 'float',
        'avg_fuel_cost' => 'float',
        'avg_duration_hours' => 'float',
        'avg_mileage_kmpl' => 'float',
        'avg_revenue' => 'float',
        'avg_profit' => 'float',
        'last_calculated_at' => 'datetime',
    ];

    public function bestVehicle()
    {
        return $this->belongsTo(Vehicle::class, 'best_vehicle_id');
    }

    public function worstVehicle()
    {
        return $this->belongsTo(Vehicle::class, 'worst_vehicle_id');
    }

    public function bestDriver()
    {
        return $this->belongsTo(Driver::class, 'best_driver_id');
    }

    public function worstDriver()
    {
        return $this->belongsTo(Driver::class, 'worst_driver_id');
    }

    public static function generateRouteKey(string $pickup, string $destination): string
    {
        return md5(strtolower(trim($pickup)) . '|' . strtolower(trim($destination)));
    }
}
