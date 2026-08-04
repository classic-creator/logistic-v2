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
        Schema::table('trips', function (Blueprint $table) {
            // Fuel estimation engine fields (computed automatically on create/start)
            $table->decimal("estimated_distance", 8, 2)->nullable();
            $table->decimal("estimated_fuel_liters", 10, 2)->nullable();
            $table->decimal("estimated_fuel_cost", 12, 2)->nullable();
            $table->decimal("estimated_mileage", 8, 2)->nullable();
            $table->decimal("estimated_travel_hours", 8, 2)->nullable();

            // Odometer tracking
            $table->decimal("start_odometer", 12, 2)->nullable();
            $table->decimal("end_odometer", 12, 2)->nullable();

            // Snapshot of the fuel price used for this trip
            $table->decimal("fuel_price_per_liter", 10, 2)->nullable();
            $table->unsignedBigInteger("fuel_price_id")->nullable();

            // Mileage actually achieved on this trip (actual_distance / actual_fuel)
            $table->decimal("actual_fuel_liters", 10, 2)->nullable();
            $table->decimal("actual_fuel_cost", 12, 2)->nullable();
            $table->decimal("actual_mileage", 8, 2)->nullable();
            $table->string("fuel_variance_status")->default("pending");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropColumn([
                'estimated_distance',
                'estimated_fuel_liters',
                'estimated_fuel_cost',
                'estimated_mileage',
                'estimated_travel_hours',
                'start_odometer',
                'end_odometer',
                'fuel_price_per_liter',
                'fuel_price_id',
                'actual_fuel_liters',
                'actual_fuel_cost',
                'actual_mileage',
                'fuel_variance_status',
            ]);
        });
    }
};
