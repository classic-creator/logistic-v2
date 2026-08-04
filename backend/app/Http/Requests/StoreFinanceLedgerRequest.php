<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class StoreFinanceLedgerRequest extends FormRequest {
    public function authorize() { return true; }
    public function rules() {
        return [
            'trip_id' => 'required|exists:trips,id|unique:finance_ledgers,trip_id',
            'company_id' => 'required|exists:companies,id',
            'invoice_number' => 'required|unique:finance_ledgers,invoice_number',
            'trip_amount' => 'required|numeric|min:0',
            'diesel_expense' => 'nullable|numeric|min:0',
            'toll_expense' => 'nullable|numeric|min:0',
            'driver_allowance' => 'nullable|numeric|min:0',
            'loading_charge' => 'nullable|numeric|min:0',
            'unloading_charge' => 'nullable|numeric|min:0',
            'other_expenses' => 'nullable|numeric|min:0',
            'payment_received' => 'nullable|numeric|min:0',
            'remarks' => 'nullable',
            'recorded_at' => 'required|date'
        ];
    }
}