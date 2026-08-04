<?php

namespace App\Services;

use App\Models\FinanceLedger;
use App\Models\FuelEntry;
use App\Models\Trip;

/**
 * Finance Integration.
 *
 * Every approved fuel entry automatically rolls into the trip's finance ledger
 * (diesel expense), which in turn drives total expenses, net profit, the finance
 * dashboard, reports and analytics. No manual synchronization required.
 */
class FuelFinanceService
{
    /**
     * Sync a fuel entry's impact onto its trip ledger.
     */
    public function syncFuelEntry(FuelEntry $entry): void
    {
        if (!$entry->trip_id || !$entry->isApproved()) return;

        $trip = Trip::with('financeLedger')->find($entry->trip_id);
        if (!$trip) return;

        $this->syncTripDieselExpense($trip);
    }

    /**
     * Recompute the diesel expense for a trip from all approved fuel entries
     * and refresh the derived ledger fields.
     */
    public function syncTripDieselExpense(Trip $trip): FinanceLedger
    {
        $ledger = $trip->financeLedger ?? $this->createLedgerForTrip($trip);

        $diesel = (float) $trip->approvedFuelEntries()->sum('total_cost');

        $data = array_merge($ledger->toArray(), [
            'diesel_expense' => round($diesel, 2),
        ]);

        $ledger->update($this->calculateFields($data));

        return $ledger->refresh();
    }

    public function createLedgerForTrip(Trip $trip): FinanceLedger
    {
        return FinanceLedger::create([
            'trip_id' => $trip->id,
            'company_id' => $trip->company_id,
            'recorded_at' => now(),
        ]);
    }

    /**
     * Mirror of FinanceLedgerController::calculateFields to keep ledger math consistent.
     */
    private function calculateFields(array $data): array
    {
        $fields = ['diesel_expense', 'toll_expense', 'driver_allowance', 'loading_charge', 'unloading_charge', 'other_expenses', 'payment_received', 'trip_amount'];
        foreach ($fields as $field) {
            $data[$field] = (float) ($data[$field] ?? 0);
        }

        $totalExpenses = $data['diesel_expense'] + $data['toll_expense'] + $data['driver_allowance']
            + $data['loading_charge'] + $data['unloading_charge'] + $data['other_expenses'];

        $netProfit = $data['trip_amount'] - $totalExpenses;
        $pendingAmount = $data['trip_amount'] - $data['payment_received'];
        $profitMargin = $data['trip_amount'] > 0 ? ($netProfit / $data['trip_amount']) * 100 : 0;

        $status = 'Pending';
        if ($pendingAmount <= 0) $status = 'Paid';
        elseif ($data['payment_received'] > 0) $status = 'Partial';

        $data['total_expenses'] = round($totalExpenses, 2);
        $data['net_profit'] = round($netProfit, 2);
        $data['pending_amount'] = round($pendingAmount, 2);
        $data['profit_margin'] = round($profitMargin, 2);
        $data['status'] = $status;

        return $data;
    }
}
