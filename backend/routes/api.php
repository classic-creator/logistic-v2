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
        Route::post('/fuel-entries/parse-receipt', [\App\Http\Controllers\FuelReceiptScannerController::class, 'scan']);
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
        
        Route::prefix('fuel/intelligence')->group(function () {
            Route::get('/overview', [FuelIntelligenceController::class, 'intelligenceOverview']);
            Route::get('/predictions', [FuelIntelligenceController::class, 'predictionHistory']);
            Route::get('/recommendations', [FuelIntelligenceController::class, 'recommendations']);
            Route::get('/learning', [FuelIntelligenceController::class, 'learningStatus']);
            Route::get('/scores', [FuelIntelligenceController::class, 'fuelScores']);
            Route::get('/variance', [FuelIntelligenceController::class, 'varianceAnalysis']);
            Route::get('/routes', [FuelIntelligenceController::class, 'routeIntelligence']);
            Route::get('/customers', [FuelIntelligenceController::class, 'customerIntelligence']);
            Route::post('/predict', [FuelIntelligenceController::class, 'predictOnDemand']);
            Route::post('/recommend', [FuelIntelligenceController::class, 'recommendOnDemand']);
            Route::get('/anomalies', [FuelIntelligenceController::class, 'anomalyDashboard']);
            Route::get('/ml-status', [FuelIntelligenceController::class, 'mlModelStatus']);
            Route::post('/ml-retrain', [FuelIntelligenceController::class, 'mlRetrain']);
        });
        // --- Master Notification Engine ---
        Route::prefix('notifications')->group(function () {
            Route::get('/', [\App\Http\Controllers\NotificationController::class, 'index']);
            Route::get('/unread-count', [\App\Http\Controllers\NotificationController::class, 'unreadCount']);
            Route::patch('/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
            Route::post('/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllRead']);
            Route::patch('/{id}/archive', [\App\Http\Controllers\NotificationController::class, 'archive']);
            Route::delete('/{id}', [\App\Http\Controllers\NotificationController::class, 'destroy']);
            Route::get('/logs', [\App\Http\Controllers\NotificationController::class, 'deliveryLogs']);
            Route::post('/push-subscribe', [\App\Http\Controllers\NotificationController::class, 'pushSubscribe']);
            Route::post('/push-unsubscribe', [\App\Http\Controllers\NotificationController::class, 'pushUnsubscribe']);
            Route::get('/vapid-public-key', [\App\Http\Controllers\NotificationController::class, 'getVapidPublicKey']);
            Route::get('/preferences', [\App\Http\Controllers\NotificationController::class, 'getPreferences']);
            Route::put('/preferences', [\App\Http\Controllers\NotificationController::class, 'updatePreferences']);
            Route::post('/trigger-test-event', [\App\Http\Controllers\NotificationController::class, 'triggerTestEvent']);
        });
    });
});

Route::post('/orders/{order}/assign-dispatch', [OrderController::class, 'assignDispatch']);
Route::patch('/trips/{trip}/accept', [TripController::class, 'accept']);
Route::patch('/trips/{trip}/start', [TripController::class, 'start']);
Route::patch('/trips/{trip}/mark-delivered', [TripController::class, 'markDelivered']);
Route::patch('/trips/{trip}/complete', [TripController::class, 'complete']);
Route::patch('/trips/{trip}/cancel', [TripController::class, 'cancel']);

Route::get('/dashboard/summary', [App\Http\Controllers\DashboardController::class, 'summary'])->middleware('auth:sanctum');
