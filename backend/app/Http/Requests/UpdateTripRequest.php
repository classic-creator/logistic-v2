<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class UpdateTripRequest extends FormRequest {
    public function authorize() { return true; }
    public function rules() {
        $trip = $this->route('trip');
        $startOdo = $this->input('start_odometer') ?? ($trip ? $trip->start_odometer : 0);
        
        return [
            'status' => 'nullable|string',
            'remarks' => 'nullable|string',
            'start_odometer' => 'nullable|numeric',
            'end_odometer' => 'nullable|numeric' . ($startOdo ? '|gt:' . $startOdo : ''),
            'pickup_photo' => 'nullable|string',
            'delivery_photo' => 'nullable|string',
            'pod_photo' => 'nullable|string',
            'pickup_date' => 'nullable|string',
            'delivery_date' => 'nullable|string',
            'start_date' => 'nullable|string',
            'end_date' => 'nullable|string',
        ];
    }
}