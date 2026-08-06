<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class UpdateFuelEntryRequest extends FormRequest {
    public function authorize() { return true; }
    public function rules() {
        return [
            'trip_id' => 'nullable|exists:trips,id',
            'vehicle_id' => 'nullable|exists:vehicles,id',
            'driver_id' => 'nullable|exists:drivers,id',
            'company_id' => 'nullable|exists:companies,id',
            'fuel_type' => 'nullable|in:Diesel,Petrol,CNG,Electric',
            'quantity' => 'sometimes|numeric|min:0.01',
            'unit_price' => 'nullable|numeric|min:0',
            'total_cost' => 'nullable|numeric|min:0',
            'odometer' => 'nullable|numeric|min:0',
            'station_name' => 'nullable|string|max:255',
            'payment_method' => 'nullable|string|max:60',
            'remarks' => 'nullable|string|max:1000',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'filled_at' => 'nullable|date',
            'status' => 'nullable|in:Pending,Approved,Rejected',
            'receipt_path' => 'nullable|string|max:2048',
        ];
    }
}
