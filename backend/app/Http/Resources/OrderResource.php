<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'company_name' => $this->company?->name,
            'pickup_location' => $this->pickup_location,
            'destination' => $this->destination,
            'pickup_place_id' => $this->pickup_place_id,
            'destination_place_id' => $this->destination_place_id,
            'pickup_latitude' => $this->pickup_latitude,
            'pickup_longitude' => $this->pickup_longitude,
            'destination_latitude' => $this->destination_latitude,
            'destination_longitude' => $this->destination_longitude,
            'route_source' => $this->route_source,
            'route_distance_km' => $this->route_distance_km,
            'route_distance_text' => $this->route_distance_text,
            'route_duration_hours' => $this->route_duration_hours,
            'route_duration_text' => $this->route_duration_text,
            'material' => $this->material,
            'weight' => $this->weight,
            'vehicle_requirement' => $this->vehicle_type_required,
            'priority' => $this->priority,
            'delivery_date' => $this->delivery_date ? $this->delivery_date->format('Y-m-d') : null,
            'notes' => $this->notes,
            'status' => $this->status,
            'driver_name' => $this->trip?->driver_name ?: $this->trip?->driver?->name,
            'vehicle_number' => $this->trip?->vehicle_number ?: $this->trip?->vehicle?->number,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
