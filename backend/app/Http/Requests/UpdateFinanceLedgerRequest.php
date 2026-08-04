<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class UpdateFinanceLedgerRequest extends FormRequest {
    public function authorize() { return true; }
    public function rules() {
        return [
            'invoice_number' => 'required|unique:finance_ledgers,invoice_number,' . $this->finance->id,
            'trip_amount' => 'required|numeric|min:0',
            'diesel_expense' => 'nullable|numeric|min:0',
            'toll_expense' => 'nullable|numeric|min:0',
            'driver_allowance' => 'nullable|numeric|min:0',
            'loading_charge' => 'nullable|numeric|min:0',
            'unloading_charge' => 'nullable|numeric|min:0',
            'other_expenses' => 'nullable|numeric|min:0',
            'payment_received' => 'nullable|numeric|min:0',
            'remarks' => 'nullable'
        ];
    }
}