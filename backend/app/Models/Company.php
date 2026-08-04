<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Company extends Model
{
    use HasFactory, SoftDeletes;
    protected $guarded = [];

    public function orders() { return $this->hasMany(Order::class); }
    public function trips() { return $this->hasMany(Trip::class); }
    public function fuelEntries() { return $this->hasMany(FuelEntry::class); }
    public function fuelPrices() { return $this->hasMany(FuelPrice::class); }
}
