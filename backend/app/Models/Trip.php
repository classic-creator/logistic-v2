<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Trip extends Model
{
    use HasFactory, SoftDeletes;
    protected $guarded = [];

    protected $casts = [
        'pickup_date' => 'date',
        'delivery_date' => 'date',
        'is_delayed' => 'boolean',
        'last_tracked_at' => 'datetime',
    ];

    public function order() { return $this->belongsTo(Order::class); }
    public function company() { return $this->belongsTo(Company::class); }
    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function driver() { return $this->belongsTo(Driver::class); }
    public function statusHistories() { return $this->hasMany(TripStatusHistory::class); }
    public function trackingPoints() { return $this->hasMany(TripTrackingPoint::class); }
    public function documents() { return $this->hasMany(TripDocument::class); }
    public function financeLedger() { return $this->hasOne(FinanceLedger::class); }
}
