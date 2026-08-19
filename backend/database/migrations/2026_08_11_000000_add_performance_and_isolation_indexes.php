<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 0. Ensure company_id exists on vehicles and drivers tables
        Schema::table('vehicles', function (Blueprint $table) {
            if (!Schema::hasColumn('vehicles', 'company_id')) {
                $table->unsignedBigInteger('company_id')->nullable()->after('id');
            }
        });

        Schema::table('drivers', function (Blueprint $table) {
            if (!Schema::hasColumn('drivers', 'company_id')) {
                $table->unsignedBigInteger('company_id')->nullable()->after('id');
            }
        });

        $this->addIndexSafely('trips', function (Blueprint $table) {
            $table->index(['company_id', 'status'], 'idx_trips_company_status');
            $table->index('vehicle_id', 'idx_trips_vehicle_id');
            $table->index('driver_id', 'idx_trips_driver_id');
            $table->index('order_id', 'idx_trips_order_id');
            $table->index('start_date', 'idx_trips_start_date');
            $table->index('delivery_date', 'idx_trips_delivery_date');
            $table->index('pickup_location', 'idx_trips_pickup_loc');
            $table->index('destination', 'idx_trips_destination');
        });

        $this->addIndexSafely('orders', function (Blueprint $table) {
            $table->index(['company_id', 'status'], 'idx_orders_company_status');
            $table->index('created_at', 'idx_orders_created_at');
        });

        $this->addIndexSafely('vehicles', function (Blueprint $table) {
            $table->index(['company_id', 'status'], 'idx_vehicles_company_status');
            $table->index('number', 'idx_vehicles_number');
        });

        $this->addIndexSafely('drivers', function (Blueprint $table) {
            $table->index(['company_id', 'status'], 'idx_drivers_company_status');
            $table->index('name', 'idx_drivers_name');
        });

        $this->addIndexSafely('companies', function (Blueprint $table) {
            $table->index('name', 'idx_companies_name');
        });

        $this->addIndexSafely('fuel_entries', function (Blueprint $table) {
            $table->index(['company_id', 'status'], 'idx_fuel_company_status');
            $table->index(['vehicle_id', 'filled_at'], 'idx_fuel_vehicle_filled');
            $table->index(['driver_id', 'filled_at'], 'idx_fuel_driver_filled');
            $table->index(['trip_id', 'status'], 'idx_fuel_trip_status');
            $table->index('filled_at', 'idx_fuel_filled_at');
            $table->index('is_flagged', 'idx_fuel_is_flagged');
        });

        $this->addIndexSafely('finance_ledgers', function (Blueprint $table) {
            $table->index(['company_id', 'status'], 'idx_finance_company_status');
            $table->index('trip_id', 'idx_finance_trip_id');
            $table->index('created_at', 'idx_finance_created_at');
        });

        $this->addIndexSafely('users', function (Blueprint $table) {
            $table->index('company_id', 'idx_users_company_id');
            $table->index('role', 'idx_users_role');
        });
    }

    protected function addIndexSafely(string $tableName, Closure $callback): void
    {
        try {
            Schema::table($tableName, $callback);
        } catch (\Throwable $e) {
            // Ignore duplicate key name errors
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive rollback
    }
};
