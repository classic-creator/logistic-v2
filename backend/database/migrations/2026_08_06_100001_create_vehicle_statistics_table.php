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
        Schema::create('vehicle_statistics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->unique();
            $table->unsignedInteger('total_trips')->default(0);
            $table->decimal('total_distance_km', 12, 2)->default(0);
            $table->decimal('total_fuel_liters', 10, 2)->default(0);
            $table->decimal('total_fuel_cost', 12, 2)->default(0);
            $table->decimal('avg_mileage_kmpl', 6, 2)->default(0);
            $table->decimal('loaded_mileage', 6, 2)->nullable();
            $table->decimal('empty_mileage', 6, 2)->nullable();
            $table->decimal('highway_mileage', 6, 2)->nullable();
            $table->decimal('city_mileage', 6, 2)->nullable();
            $table->decimal('manufacturer_mileage', 6, 2)->nullable();
            $table->decimal('current_learned_mileage', 6, 2)->nullable();
            $table->decimal('lifetime_running_hours', 10, 2)->default(0);
            $table->unsignedTinyInteger('fuel_score')->default(50);
            $table->decimal('confidence_score', 3, 2)->default(0);
            $table->timestamp('last_calculated_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_statistics');
    }
};
