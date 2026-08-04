<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class UpdateFuelPriceRequest extends FormRequest {
    public function authorize() { return true; }
    public function rules() {
        return [
            'company_id' => 'nullable|exists:companies,id',
            'state' => 'nullable|string|max:80',
            'city' => 'nullable|string|max:80',
            'fuel_type' => 'nullable|in:Diesel,Petrol,CNG,Electric',
            'price_per_liter' => 'sometimes|numeric|min:0',
            'effective_from' => 'nullable|date',
            'effective_to' => 'nullable|date',
            'is_active' => 'nullable|boolean',
        ];
    }
}
