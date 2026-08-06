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
        Schema::create('prediction_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
            $table->decimal('predicted_distance', 10, 2)->nullable();
            $table->decimal('predicted_fuel_liters', 10, 2)->nullable();
            $table->decimal('predicted_fuel_cost', 12, 2)->nullable();
            $table->decimal('predicted_mileage', 6, 2)->nullable();
            $table->decimal('predicted_duration_hours', 8, 2)->nullable();
            $table->decimal('predicted_profit', 12, 2)->nullable();
            $table->decimal('actual_distance', 10, 2)->nullable();
            $table->decimal('actual_fuel_liters', 10, 2)->nullable();
            $table->decimal('actual_fuel_cost', 12, 2)->nullable();
            $table->decimal('actual_mileage', 6, 2)->nullable();
            $table->decimal('accuracy_score', 5, 2)->nullable();
            $table->json('prediction_factors')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prediction_history');
    }
};
