<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class StoreTripRequest extends FormRequest {
    public function authorize() { return true; }
    public function rules() {
        return [
            'order_id' => 'nullable|exists:orders,id',
            'company_id' => 'required|exists:companies,id',
            'company_name' => 'nullable',
            'vehicle_id' => 'required|exists:vehicles,id',
            'vehicle_number' => 'nullable',
            'driver_id' => 'required|exists:drivers,id',
            'driver_name' => 'nullable',
            'distance' => 'required|numeric|min:0',
            'estimated_duration' => 'required|numeric|min:0',
            'pickup_location' => 'nullable',
            'destination' => 'nullable',
            'pickup_coordinates' => 'nullable',
            'destination_coordinates' => 'nullable',
            'pickup_place_id' => 'nullable',
            'destination_place_id' => 'nullable',
            'route_source' => 'nullable',
            'route_distance_text' => 'nullable',
            'route_duration_text' => 'nullable',
            'material' => 'nullable',
            'weight' => 'nullable',
            'remarks' => 'nullable'
        ];
    }
}