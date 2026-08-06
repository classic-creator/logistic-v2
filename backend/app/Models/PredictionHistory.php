<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PredictionHistory extends Model
{
    use HasFactory;

    protected $table = 'prediction_history';

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'predicted_distance' => 'float',
        'predicted_fuel_liters' => 'float',
        'predicted_fuel_cost' => 'float',
        'predicted_mileage' => 'float',
        'predicted_duration_hours' => 'float',
        'predicted_profit' => 'float',
        'actual_distance' => 'float',
        'actual_fuel_liters' => 'float',
        'actual_fuel_cost' => 'float',
        'actual_mileage' => 'float',
        'accuracy_score' => 'float',
        'prediction_factors' => 'array',
    ];

    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }
}
