<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Trip;
use App\Models\Driver;
use App\Models\FinanceLedger;

class DashboardController extends Controller
{
    public function summary()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_trips' => Trip::count(),
                'active_trips' => Trip::whereIn('status', ['Assigned', 'Running'])->count(),
                'available_drivers' => Driver::where('status', 'Available')->count(),
                'net_profit' => FinanceLedger::sum('net_profit'),
                'total_revenue' => FinanceLedger::sum('trip_amount'),
                'outstanding' => FinanceLedger::sum('pending_amount'),
            ]
        ]);
    }
}
