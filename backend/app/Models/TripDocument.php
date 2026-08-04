<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripDocument extends Model
{
    protected $guarded = [];

    public function trip() { return $this->belongsTo(Trip::class); }
    public function uploader() { return $this->belongsTo(User::class, 'uploaded_by_user_id'); }
}
