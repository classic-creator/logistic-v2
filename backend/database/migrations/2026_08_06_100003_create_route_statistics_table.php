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
        Schema::create('route_statistics', function (Blueprint $table) {
            $table->id();
            $table->string('route_key', 64)->unique();
            $table->string('pickup_location', 255);
            $table->string('destination', 255);
            $table->unsignedInteger('total_trips')->default(0);
            $table->decimal('avg_distance_km', 10, 2)->default(0);
            $table->decimal('avg_fuel_liters', 10, 2)->default(0);
            $table->decimal('avg_fuel_cost', 12, 2)->default(0);
            $table->decimal('avg_duration_hours', 8, 2)->default(0);
            $table->decimal('avg_mileage_kmpl', 6, 2)->default(0);
            $table->decimal('avg_revenue', 12, 2)->default(0);
            $table->decimal('avg_profit', 12, 2)->default(0);
            $table->foreignId('best_vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('best_driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->foreignId('worst_vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('worst_driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->unsignedTinyInteger('route_fuel_score')->default(50);
            $table->timestamp('last_calculated_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('route_statistics');
    }
};
