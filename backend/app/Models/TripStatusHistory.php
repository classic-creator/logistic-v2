<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripStatusHistory extends Model
{
    protected $guarded = [];
    public $timestamps = false;

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function trip() { return $this->belongsTo(Trip::class); }
    public function user() { return $this->belongsTo(User::class, 'changed_by_user_id'); }
}
