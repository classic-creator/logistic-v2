<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LearningHistory extends Model
{
    use HasFactory;

    protected $table = 'learning_history';

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'previous_mileage' => 'float',
        'new_mileage' => 'float',
        'confidence_score' => 'float',
        'weight_decay_factor' => 'float',
    ];

    public function scopeForEntity($query, string $type, int $id)
    {
        return $query->where('entity_type', $type)->where('entity_id', $id);
    }

    public function scopeRecent($query, int $limit = 10)
    {
        return $query->latest()->limit($limit);
    }
}
