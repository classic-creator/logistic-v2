<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class UpdateDriverRequest extends FormRequest {
    public function authorize() { return true; }
    public function rules() {
        return [
            'name' => 'required|max:150',
            'mobile' => 'required|unique:drivers,mobile,' . $this->driver->id,
            'license_number' => 'required|unique:drivers,license_number,' . $this->driver->id,
            'license_expiry_date' => 'required|date',
            'aadhaar_number' => 'required|unique:drivers,aadhaar_number,' . $this->driver->id,
            'emergency_contact' => 'required',
            'status' => 'required|in:Available,On Trip,Leave,Offline',
            'assigned_vehicle_id' => 'nullable|exists:vehicles,id'
        ];
    }
}