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
        Schema::table('vehicles', function (Blueprint $table) {
            // Manufacturer specification
            $table->decimal("manufacturer_mileage", 8, 2)->nullable();
            // Contextual mileages (km per liter)
            $table->decimal("highway_mileage", 8, 2)->nullable();
            $table->decimal("city_mileage", 8, 2)->nullable();
            $table->decimal("loaded_mileage", 8, 2)->nullable();
            $table->decimal("empty_mileage", 8, 2)->nullable();
            // Rolling historical average computed from fuel entries
            $table->decimal("current_avg_mileage", 8, 2)->nullable();
            $table->decimal("tank_capacity", 10, 2)->nullable();
            $table->decimal("last_odometer", 12, 2)->nullable();
            $table->string("fuel_grade")->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn([
                'manufacturer_mileage',
                'highway_mileage',
                'city_mileage',
                'loaded_mileage',
                'empty_mileage',
                'current_avg_mileage',
                'tank_capacity',
                'last_odometer',
                'fuel_grade',
            ]);
        });
    }
};
