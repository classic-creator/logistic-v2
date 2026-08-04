<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TripResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'company_id' => $this->company_id ?? $this->order?->company_id,
            'vehicle_id' => $this->vehicle_id,
            'driver_id' => $this->driver_id,
            'company_name' => $this->company_name ?? $this->order?->company?->name,
            'driver_name' => $this->driver_name ?? $this->driver?->name,
            'vehicle_number' => $this->vehicle_number ?? $this->vehicle?->number,
            'pickup_location' => $this->pickup_location ?? $this->order?->pickup_location,
            'destination' => $this->destination ?? $this->order?->destination,
            'pickup_date' => $this->pickup_date ? $this->pickup_date->format('Y-m-d') : null,
            'delivery_date' => $this->delivery_date ? $this->delivery_date->format('Y-m-d') : null,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'status' => $this->status,
            'material' => $this->material ?? $this->order?->material,
            'weight' => $this->weight ?? $this->order?->weight,
            'distance' => $this->distance ?? $this->order?->route_distance_km ?? 380,
            'estimated_duration' => $this->estimated_duration ?? $this->order?->route_duration_hours ?? 12,
            'speed' => $this->speed ?? 0,
            'eta' => $this->eta ?? '—',
            'remaining_distance' => $this->remaining_distance ?? 0,
            'last_updated' => $this->last_updated ?? $this->updated_at?->toIso8601String(),
            'driver_mobile' => $this->driver?->mobile ?? '1800250500',
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
