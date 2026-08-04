<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FuelPrice extends Model
{
    use HasFactory;
    protected $guarded = [];

    protected $casts = [
        'price_per_liter' => 'float',
        'effective_from' => 'date',
        'effective_to' => 'date',
        'is_active' => 'boolean',
    ];

    public function company() { return $this->belongsTo(Company::class); }

    /**
     * Resolve the fuel price that applies for a trip at a given point in time.
     * Priority: city + fuel_type -> state + fuel_type -> global fuel_type.
     */
    public static function resolve(
        ?string $city = null,
        ?string $fuelType = 'Diesel',
        ?int $companyId = null,
        $at = null
    ): ?FuelPrice {
        $at = $at ?? now();
        $query = static::query()
            ->where('fuel_type', $fuelType)
            ->where('is_active', true)
            ->where(function ($q) use ($at) {
                $q->whereNull('effective_from')->orWhereDate('effective_from', '<=', $at);
                $q->whereNull('effective_to')->orWhereDate('effective_to', '>=', $at);
            })
            ->orderBy('price_per_liter');

        if ($companyId) {
            $query->where('company_id', $companyId);
        }

        $cityMatch = (clone $query)->where('city', $city);
        if ($cityMatch->exists()) {
            return $cityMatch->first();
        }

        $stateMatch = (clone $query)->whereNull('city');
        if ($stateMatch->exists()) {
            return $stateMatch->first();
        }

        $global = (clone $query)->whereNull('state')->whereNull('city');
        return $global->first();
    }
}
