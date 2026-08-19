<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Company;
use App\Models\Trip;
use App\Models\FuelEntry;
use App\Services\AnomalyDetectionService;
use App\Services\Intelligence\StatisticsAggregator;

class SeedTestFuelScenariosCommand extends Command
{
    protected $signature = 'fuel:seed-test-scenarios {--count=10 : Number of synthetic trips per scenario}';
    protected $description = 'Seed repeatable development test scenarios with is_synthetic=true flag';

    public function handle(AnomalyDetectionService $anomalies, StatisticsAggregator $aggregator): int
    {
        $this->info('Seeding development test scenarios (is_synthetic = true)...');

        $company = Company::firstOrCreate(['name' => 'Synthetic Test Logistics Corp']);

        $vehicle = Vehicle::firstOrCreate(
            ['number' => 'SYNTHETIC-T-01'],
            [
                'company_id' => $company->id,
                'type' => 'Heavy Truck',
                'fuel_type' => 'Diesel',
                'tank_capacity' => 300,
                'manufacturer_mileage' => 4.5,
                'current_avg_mileage' => 4.5,
                'last_odometer' => 50000,
            ]
        );

        $driver = Driver::firstOrCreate(
            ['name' => 'Synthetic Test Driver'],
            ['company_id' => $company->id, 'mobile' => '9999988888']
        );

        // 1. Normal Efficient Trip
        $trip1 = Trip::create([
            'company_id' => $company->id,
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'pickup_location' => 'Mumbai',
            'destination' => 'Pune',
            'distance' => 150,
            'cargo_weight' => 5000,
            'start_odometer' => 50000,
            'end_odometer' => 50150,
            'status' => 'Completed',
            'is_synthetic' => true,
        ]);

        $entry1 = FuelEntry::create([
            'company_id' => $company->id,
            'trip_id' => $trip1->id,
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'quantity' => 33.33,
            'unit_price' => 92.50,
            'total_cost' => 3083.00,
            'odometer' => 50150,
            'station_name' => 'IOCL Mumbai Highway',
            'status' => FuelEntry::STATUS_APPROVED,
            'is_synthetic' => true,
            'filled_at' => now()->subDays(2),
        ]);
        $anomalies->inspect($entry1);

        // 2. High Fuel Consumption Anomaly
        $trip2 = Trip::create([
            'company_id' => $company->id,
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'pickup_location' => 'Delhi',
            'destination' => 'Jaipur',
            'distance' => 280,
            'estimated_fuel_cost' => 5500,
            'cargo_weight' => 8000,
            'start_odometer' => 50150,
            'end_odometer' => 50430,
            'status' => 'Completed',
            'is_synthetic' => true,
        ]);

        $entry2 = FuelEntry::create([
            'company_id' => $company->id,
            'trip_id' => $trip2->id,
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'quantity' => 95.0,
            'unit_price' => 92.50,
            'total_cost' => 8787.50,
            'odometer' => 50430,
            'station_name' => 'HPCL Delhi Bypass',
            'status' => FuelEntry::STATUS_PENDING,
            'is_synthetic' => true,
            'filled_at' => now()->subDay(),
        ]);
        $anomalies->inspect($entry2);

        // 3. Duplicate Fuel Entry Anomaly
        $entry3 = FuelEntry::create([
            'company_id' => $company->id,
            'trip_id' => $trip1->id,
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'quantity' => 33.33,
            'unit_price' => 92.50,
            'total_cost' => 3083.00,
            'odometer' => 50150,
            'station_name' => 'IOCL Mumbai Highway',
            'status' => FuelEntry::STATUS_PENDING,
            'is_synthetic' => true,
            'filled_at' => now()->subDays(2),
        ]);
        $anomalies->inspect($entry3);

        // 4. Tank Over-Capacity Anomaly
        $entry4 = FuelEntry::create([
            'company_id' => $company->id,
            'trip_id' => $trip2->id,
            'vehicle_id' => $vehicle->id,
            'driver_id' => $driver->id,
            'quantity' => 450.0,
            'unit_price' => 92.50,
            'total_cost' => 41625.00,
            'odometer' => 50430,
            'station_name' => 'BPCL Jaipur City',
            'status' => FuelEntry::STATUS_REJECTED,
            'is_synthetic' => true,
            'filled_at' => now(),
        ]);
        $anomalies->inspect($entry4);

        $this->info('Successfully seeded 8 synthetic development scenarios (is_synthetic = true).');
        return 0;
    }
}
