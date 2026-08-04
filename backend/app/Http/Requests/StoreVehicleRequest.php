<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class StoreVehicleRequest extends FormRequest {
    public function authorize() { return true; }
    public function rules() {
        return [
            'number' => 'required|unique:vehicles,number',
            'type' => 'required',
            'capacity' => 'required',
            'fuel_type' => 'required|in:Diesel,CNG,Electric,Petrol',
            'rc' => 'required|unique:vehicles,rc',
            'insurance' => 'required|unique:vehicles,insurance',
            'fitness' => 'required',
            'pollution' => 'required',
            'gps_id' => 'nullable|unique:vehicles,gps_id',
            'permit' => 'required',
            'status' => 'required|in:Available,Running,Maintenance,Inactive'
        ];
    }
}