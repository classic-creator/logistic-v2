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
        Schema::create('driver_statistics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained()->unique();
            $table->unsignedInteger('total_trips')->default(0);
            $table->decimal('total_distance_km', 12, 2)->default(0);
            $table->decimal('total_fuel_liters', 10, 2)->default(0);
            $table->decimal('total_fuel_cost', 12, 2)->default(0);
            $table->decimal('avg_mileage_kmpl', 6, 2)->default(0);
            $table->decimal('avg_fuel_cost_per_km', 6, 2)->default(0);
            $table->unsignedTinyInteger('fuel_efficiency_score')->default(50);
            $table->unsignedTinyInteger('driving_efficiency_score')->default(50);
            $table->unsignedTinyInteger('fuel_score')->default(50);
            $table->timestamp('last_calculated_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('driver_statistics');
    }
};
