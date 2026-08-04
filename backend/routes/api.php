<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\FinanceLedgerController;
use App\Http\Controllers\VehicleMaintenanceLogController;
use App\Http\Controllers\FuelEntryController;
use App\Http\Controllers\FuelPriceController;
use App\Http\Controllers\FuelIntelligenceController;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::get('/demo/drivers', [DriverController::class, 'index']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        
        Route::apiResource('companies', CompanyController::class);
        Route::apiResource('vehicles', VehicleController::class);
        Route::apiResource('drivers', DriverController::class);
        Route::apiResource('orders', OrderController::class);
        Route::apiResource('trips', TripController::class);
        Route::apiResource('finances', FinanceLedgerController::class);

        // --- Fuel Intelligence System ---
        Route::apiResource('fuel-entries', FuelEntryController::class);
        Route::post('/fuel-entries/{fuelEntry}/approve', [FuelEntryController::class, 'approve']);
        Route::post('/fuel-entries/{fuelEntry}/reject', [FuelEntryController::class, 'reject']);
        Route::post('/fuel-entries/{fuelEntry}/rescan', [FuelEntryController::class, 'rescan']);

        Route::apiResource('fuel-prices', FuelPriceController::class);

        Route::post('/fuel/estimate-preview', [FuelIntelligenceController::class, 'estimatePreview']);
        Route::get('/fuel/trips/{trip}/breakdown', [FuelIntelligenceController::class, 'tripBreakdown']);
        Route::get('/fuel/dashboard', [FuelIntelligenceController::class, 'dashboard']);
        Route::get('/fuel/analytics', [FuelIntelligenceController::class, 'analytics']);
        Route::get('/fuel/vehicles/{vehicle}', [FuelIntelligenceController::class, 'vehiclePerformance']);
        Route::get('/fuel/drivers/{driver}', [FuelIntelligenceController::class, 'driverPerformance']);
    });
});

Route::post('/orders/{order}/assign-dispatch', [OrderController::class, 'assignDispatch']);
Route::patch('/trips/{trip}/accept', [TripController::class, 'accept']);
Route::patch('/trips/{trip}/start', [TripController::class, 'start']);
Route::patch('/trips/{trip}/mark-delivered', [TripController::class, 'markDelivered']);
Route::patch('/trips/{trip}/complete', [TripController::class, 'complete']);
Route::patch('/trips/{trip}/cancel', [TripController::class, 'cancel']);

Route::get('/dashboard/summary', [App\Http\Controllers\DashboardController::class, 'summary'])->middleware('auth:sanctum');
