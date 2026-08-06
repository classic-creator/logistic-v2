<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerStatistic extends Model
{
    use HasFactory;

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'total_distance_km' => 'float',
        'total_fuel_cost' => 'float',
        'avg_revenue_per_trip' => 'float',
        'avg_profit_per_trip' => 'float',
        'avg_cost_per_km' => 'float',
        'last_calculated_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
