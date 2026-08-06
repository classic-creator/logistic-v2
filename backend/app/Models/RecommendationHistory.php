<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecommendationHistory extends Model
{
    use HasFactory;

    protected $table = 'recommendation_history';

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'recommendation' => 'array',
        'confidence_percent' => 'float',
        'was_accepted' => 'boolean',
        'outcome_score' => 'float',
    ];

    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }
}
