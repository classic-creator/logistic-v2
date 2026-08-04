<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Trip;
use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\FinanceLedger;
use App\Models\FuelEntry;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function summary()
    {
        $today = Carbon::today();
        $todayEntries = FuelEntry::where('status', FuelEntry::STATUS_APPROVED)
            ->whereDate('filled_at', $today)
            ->sum('total_cost');
        $todayTripsEstimate = Trip::whereDate('start_date', $today)->sum('estimated_fuel_cost');
        $monthEntries = FuelEntry::where('status', FuelEntry::STATUS_APPROVED)
            ->whereDate('filled_at', '>=', $today->copy()->startOfMonth())
            ->sum('total_cost');

        return response()->json([
            'success' => true,
            'data' => [
                'total_trips' => Trip::count(),
                'active_trips' => Trip::whereIn('status', ['Assigned', 'Running'])->count(),
                'available_drivers' => Driver::where('status', 'Available')->count(),
                'net_profit' => FinanceLedger::sum('net_profit'),
                'total_revenue' => FinanceLedger::sum('trip_amount'),
                'outstanding' => FinanceLedger::sum('pending_amount'),
                'fuel' => [
                    'today_estimated_cost' => round((float) $todayTripsEstimate, 2),
                    'today_actual_cost' => round((float) $todayEntries, 2),
                    'month_actual_cost' => round((float) $monthEntries, 2),
                    'flagged_entries' => FuelEntry::where('is_flagged', true)->where('status', '!=', 'Rejected')->count(),
                ],
            ]
        ]);
    }
}
