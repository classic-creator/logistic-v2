<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class StoreOrderRequest extends FormRequest {
    public function authorize() { return true; }
    public function rules() {
        return [
            'company_id' => 'required|exists:companies,id',
            'pickup_location' => 'required',
            'destination' => 'required|different:pickup_location',
            'pickup_place_id' => 'nullable',
            'destination_place_id' => 'nullable',
            'pickup_latitude' => 'nullable|numeric',
            'pickup_longitude' => 'nullable|numeric',
            'destination_latitude' => 'nullable|numeric',
            'destination_longitude' => 'nullable|numeric',
            'route_source' => 'nullable',
            'route_distance_km' => 'nullable|numeric',
            'route_distance_text' => 'nullable',
            'route_duration_hours' => 'nullable|numeric',
            'route_duration_text' => 'nullable',
            'material' => 'required',
            'weight' => 'required',
            'vehicle_requirement' => 'required',
            'priority' => 'required|in:Medium,High',
            'delivery_date' => 'required',
            'notes' => 'nullable'
        ];
    }
}