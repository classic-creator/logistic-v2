<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FuelEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'trip_id' => $this->trip_id,
            'company_id' => $this->company_id,
            'branch_id' => $this->branch_id,
            'vehicle_id' => $this->vehicle_id,
            'driver_id' => $this->driver_id,
            'fuel_type' => $this->fuel_type,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'total_cost' => $this->total_cost,
            'odometer' => $this->odometer,
            'station_name' => $this->station_name,
            'payment_method' => $this->payment_method,
            'remarks' => $this->remarks,
            'receipt_path' => $this->receipt_path,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'filled_at' => $this->filled_at?->toIso8601String(),
            'status' => $this->status,
            'source' => $this->source,
            'is_flagged' => $this->is_flagged,
            'flags' => $this->flags,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),

            'trip' => new TripResource($this->whenLoaded('trip')),
            'vehicle' => new VehicleResource($this->whenLoaded('vehicle')),
            'driver' => new DriverResource($this->whenLoaded('driver')),
            'company' => new CompanyResource($this->whenLoaded('company')),
        ];
    }
}
