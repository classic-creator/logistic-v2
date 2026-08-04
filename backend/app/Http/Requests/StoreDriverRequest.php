<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class StoreDriverRequest extends FormRequest {
    public function authorize() { return true; }
    public function rules() {
        return [
            'name' => 'required|max:150',
            'mobile' => 'required|unique:drivers,mobile',
            'license' => 'required|unique:drivers,license',
            'license_expiry' => 'required|date',
            'aadhaar' => 'required|unique:drivers,aadhaar',
            'emergency_contact' => 'required',
            'status' => 'required|in:Available,On Trip,Leave,Offline',
            'assigned_vehicle' => 'nullable'
        ];
    }
}