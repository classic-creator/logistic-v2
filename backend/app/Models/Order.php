<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;
    protected $guarded = [];

    protected $casts = [
        'delivery_date' => 'date',
    ];

    public function company() { return $this->belongsTo(Company::class); }
    public function trip() { return $this->hasOne(Trip::class); }
}
