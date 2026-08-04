<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class UpdateCompanyRequest extends FormRequest {
    public function authorize() { return true; }
    public function rules() {
        return [
            'name' => 'required|max:200',
            'gst' => 'required|unique:companies,gst,' . $this->company->id,
            'address' => 'required',
            'contact_person' => 'required',
            'phone' => 'required',
            'email' => 'required|email',
            'payment_terms' => 'required',
            'status' => 'required|in:Active,Inactive',
        ];
    }
}