<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class UpdateVehicleRequest extends FormRequest {
    public function authorize() { return true; }
    public function rules() {
        return [
            'number' => 'required|unique:vehicles,number,' . $this->vehicle->id,
            'type' => 'required',
            'capacity' => 'required|numeric|min:0',
            'fuel_type' => 'required|in:Diesel,CNG,Electric,Petrol',
            'rc_number' => 'required|unique:vehicles,rc_number,' . $this->vehicle->id,
            'insurance_number' => 'required|unique:vehicles,insurance_number,' . $this->vehicle->id,
            'fitness_expiry_date' => 'required|date',
            'pollution_expiry_date' => 'required|date',
            'gps_device_id' => 'nullable|unique:vehicles,gps_device_id,' . $this->vehicle->id,
            'permit_type' => 'required|in:National,State,Local',
            'status' => 'required|in:Available,Running,Maintenance,Inactive',
        ];
    }
}