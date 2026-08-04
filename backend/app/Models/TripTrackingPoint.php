<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripTrackingPoint extends Model
{
    protected $guarded = [];

    protected $casts = [
        'recorded_at' => 'datetime',
    ];

    public function trip() { return $this->belongsTo(Trip::class); }
}
