<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleMaintenanceLog extends Model
{
    use HasFactory;
    protected $guarded = [];

    protected $casts = [
        'service_date' => 'date',
    ];

    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by_user_id'); }
}
