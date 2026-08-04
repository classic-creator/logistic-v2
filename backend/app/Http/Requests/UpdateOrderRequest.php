<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class UpdateOrderRequest extends FormRequest {
    public function authorize() { return true; }
    public function rules() {
        return [
            'company_id' => 'required|exists:companies,id',
            'pickup_location' => 'required',
            'destination' => 'required|different:pickup_location',
            'material' => 'required',
            'weight' => 'required|numeric|min:0',
            'vehicle_requirement' => 'required',
            'priority' => 'required|in:Medium,High',
            'delivery_date' => 'required|date',
        ];
    }
}