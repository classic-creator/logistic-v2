<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinanceLedger extends Model
{
    use HasFactory;
    protected $guarded = [];

    protected $casts = [
        'recorded_at' => 'date',
    ];

    public function trip() { return $this->belongsTo(Trip::class); }
    public function company() { return $this->belongsTo(Company::class); }
}
