<?php

namespace Database\Seeders;

use App\Models\FuelPrice;
use App\Models\FuelEntry;
use App\Models\Trip;
use App\Models\Vehicle;
use App\Services\FuelEstimationService;
use App\Services\AnomalyDetectionService;
use App\Services\FuelFinanceService;
use Illuminate\Database\Seeder;

class FuelSeeder extends Seeder
{
    public function run(): void
    {
        $estimator = app(FuelEstimationService::class);
        $anomalies = app(AnomalyDetectionService::class);
        $finance = app(FuelFinanceService::class);

        // ---- 1. Fuel prices by city (valid at seed time) ----
        $cities = ['Pune', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Jaipur', 'Kolkata', 'Patna', 'Ahmedabad'];
        $prices = [
            'Diesel' => 92.00,
            'Petrol' => 106.00,
            'CNG' => 76.00,
        ];

        foreach ($cities as $city) {
            foreach ($prices as $fuelType => $price) {
                FuelPrice::updateOrCreate(
                    ['city' => $city, 'fuel_type' => $fuelType],
                    [
                        'state' => null,
                        'price_per_liter' => $price,
                        'effective_from' => now()->subMonths(6)->toDateString(),
                        'is_active' => true,
                        'source' => 'seed',
                    ]
                );
            }
        }

        // Global fallback row per fuel type
        foreach ($prices as $fuelType => $price) {
            FuelPrice::updateOrCreate(
                ['city' => null, 'state' => null, 'fuel_type' => $fuelType],
                [
                    'price_per_liter' => $price,
                    'effective_from' => now()->subMonths(6)->toDateString(),
                    'is_active' => true,
                    'source' => 'seed',
                ]
            );
        }

        // ---- 2. Manufacturer mileage defaults for seeded vehicles ----
        $mileageByType = [
            '10-Ton Truck' => ['manufacturer' => 4.5, 'loaded' => 3.8, 'capacity' => 220],
            'Container' => ['manufacturer' => 3.8, 'loaded' => 3.2, 'capacity' => 350],
            'Mini Truck' => ['manufacturer' => 8.0, 'loaded' => 6.5, 'capacity' => 120],
            'Trailer' => ['manufacturer' => 2.9, 'loaded' => 2.4, 'capacity' => 500],
        ];
        foreach (Vehicle::all() as $vehicle) {
            $spec = $mileageByType[$vehicle->type] ?? ['manufacturer' => 4.0, 'loaded' => 3.5, 'capacity' => 300];
            if (!$vehicle->manufacturer_mileage) {
                $vehicle->update([
                    'manufacturer_mileage' => $spec['manufacturer'],
                    'loaded_mileage' => $spec['loaded'],
                    'tank_capacity' => $spec['capacity'],
                    'city_mileage' => $spec['manufacturer'] * 0.9,
                    'highway_mileage' => $spec['manufacturer'] * 1.15,
                    'empty_mileage' => $spec['manufacturer'] * 1.2,
                ]);
            }
        }

        // ---- 3. Fuel entries for existing trips ----
        $trip2 = Trip::find(2); // Completed: Globex, Bangalore -> Chennai, ~380km
        $trip3 = Trip::find(3); // Completed: Initech, Mumbai -> Pune, ~150km
        $trip1 = Trip::find(1); // Running today: Acme, Pune -> Mumbai

        $entries = [];

        if ($trip2) {
            $entries[] = [
                'trip_id' => 2, 'vehicle_id' => 2, 'driver_id' => 3, 'company_id' => 2,
                'fuel_type' => 'Diesel', 'quantity' => 100, 'unit_price' => 92, 'total_cost' => 9200,
                'odometer' => 45200, 'station_name' => 'HPCL Bengaluru Bypass', 'payment_method' => 'Fleet Card',
                'filled_at' => now()->subDays(5)->addHours(2), 'status' => 'Approved',
            ];
            $entries[] = [
                'trip_id' => 2, 'vehicle_id' => 2, 'driver_id' => 3, 'company_id' => 2,
                'fuel_type' => 'Diesel', 'quantity' => 40, 'unit_price' => 92, 'total_cost' => 3680,
                'odometer' => 45520, 'station_name' => 'IOCL Chennai Port', 'payment_method' => 'Cash',
                'filled_at' => now()->subDays(4)->addHours(6), 'status' => 'Approved',
            ];
        }

        if ($trip3) {
            $entries[] = [
                'trip_id' => 3, 'vehicle_id' => 3, 'driver_id' => 2, 'company_id' => 3,
                'fuel_type' => 'CNG', 'quantity' => 28, 'unit_price' => 76, 'total_cost' => 2128,
                'odometer' => 18200, 'station_name' => 'Mahanagar CNG Mumbai', 'payment_method' => 'Cash',
                'filled_at' => now()->subMonth()->addHours(3), 'status' => 'Approved',
            ];
        }

        if ($trip1) {
            $entries[] = [
                'trip_id' => 1, 'vehicle_id' => 1, 'driver_id' => 1, 'company_id' => 1,
                'fuel_type' => 'Diesel', 'quantity' => 60, 'unit_price' => 92, 'total_cost' => 5520,
                'odometer' => 35400, 'station_name' => 'Bharat Petroleum Pune', 'payment_method' => 'Fleet Card',
                'filled_at' => now()->subHours(3), 'status' => 'Approved',
            ];
            // A deliberately suspicious entry to demonstrate anomaly detection
            $entries[] = [
                'trip_id' => 1, 'vehicle_id' => 1, 'driver_id' => 1, 'company_id' => 1,
                'fuel_type' => 'Diesel', 'quantity' => 240, 'unit_price' => 92, 'total_cost' => 22080,
                'odometer' => 35400, 'station_name' => 'Bharat Petroleum Pune', 'payment_method' => 'Cash',
                'filled_at' => now()->subHours(2), 'status' => 'Pending',
            ];
        }

        foreach ($entries as $data) {
            $entry = FuelEntry::create($data);
            $entry = $anomalies->inspect($entry);
            if ($entry->isApproved()) {
                $trip = Trip::find($entry->trip_id);
                if ($trip) {
                    $estimator->refreshTripActuals($trip);
                    $finance->syncTripDieselExpense($trip);
                }
            }
        }

        // ---- 4. Backfill estimates & actuals for every trip ----
        foreach (Trip::all() as $trip) {
            $estimator->estimateAndPersist($trip);
            $estimator->refreshTripActuals($trip);
        }

        // ---- 5. Recompute vehicle rolling mileage ----
        foreach (Vehicle::all() as $vehicle) {
            $estimator->refreshVehicleMileage($vehicle);
        }
    }
}
