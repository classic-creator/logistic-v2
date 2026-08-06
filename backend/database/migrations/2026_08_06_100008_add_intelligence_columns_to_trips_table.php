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
            if (!Schema::hasColumn('trips', 'start_odometer')) {
                $table->decimal('start_odometer', 12, 2)->nullable();
            }
            if (!Schema::hasColumn('trips', 'end_odometer')) {
                $table->decimal('end_odometer', 12, 2)->nullable();
            }
            if (!Schema::hasColumn('trips', 'cargo_weight')) {
                $table->decimal('cargo_weight', 8, 2)->nullable();
            }
            if (!Schema::hasColumn('trips', 'cargo_type')) {
                $table->string('cargo_type', 100)->nullable();
            }
            if (!Schema::hasColumn('trips', 'actual_distance')) {
                $table->decimal('actual_distance', 10, 2)->nullable();
            }
            if (!Schema::hasColumn('trips', 'actual_fuel_liters')) {
                $table->decimal('actual_fuel_liters', 10, 2)->nullable();
            }
            if (!Schema::hasColumn('trips', 'actual_fuel_cost')) {
                $table->decimal('actual_fuel_cost', 12, 2)->nullable();
            }
            if (!Schema::hasColumn('trips', 'actual_mileage')) {
                $table->decimal('actual_mileage', 6, 2)->nullable();
            }
            if (!Schema::hasColumn('trips', 'fuel_budget')) {
                $table->decimal('fuel_budget', 12, 2)->nullable();
            }
            if (!Schema::hasColumn('trips', 'fuel_variance_percent')) {
                $table->decimal('fuel_variance_percent', 6, 2)->nullable();
            }
            if (!Schema::hasColumn('trips', 'trip_fuel_score')) {
                $table->unsignedTinyInteger('trip_fuel_score')->nullable();
            }
            if (!Schema::hasColumn('trips', 'prediction_id')) {
                $table->foreignId('prediction_id')->nullable()->constrained('prediction_history')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            // Reversing columns added
            $columns = [
                'start_odometer',
                'end_odometer',
                'cargo_weight',
                'cargo_type',
                'actual_distance',
                'actual_fuel_liters',
                'actual_fuel_cost',
                'actual_mileage',
                'fuel_budget',
                'fuel_variance_percent',
                'trip_fuel_score'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('trips', $column)) {
                    $table->dropColumn($column);
                }
            }
            
            if (Schema::hasColumn('trips', 'prediction_id')) {
                $table->dropForeign(['prediction_id']);
                $table->dropColumn('prediction_id');
            }
        });
    }
};
