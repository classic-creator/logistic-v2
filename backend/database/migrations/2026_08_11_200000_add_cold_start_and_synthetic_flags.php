<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for Cold-Start & Data Acquisition System.
     */
    public function up(): void
    {
        if (Schema::hasTable('trips') && !Schema::hasColumn('trips', 'is_synthetic')) {
            Schema::table('trips', function (Blueprint $table) {
                $table->boolean('is_synthetic')->default(false)->index();
            });
        }

        if (Schema::hasTable('fuel_entries') && !Schema::hasColumn('fuel_entries', 'is_synthetic')) {
            Schema::table('fuel_entries', function (Blueprint $table) {
                $table->boolean('is_synthetic')->default(false)->index();
            });
        }

        if (Schema::hasTable('prediction_history') && !Schema::hasColumn('prediction_history', 'data_source')) {
            Schema::table('prediction_history', function (Blueprint $table) {
                $table->string('data_source')->default('REAL')->index(); // REAL, SYNTHETIC, MIXED, BASELINE
                $table->unsignedTinyInteger('learning_stage')->default(1);
                $table->boolean('is_synthetic')->default(false)->index();
            });
        }

        if (Schema::hasTable('vehicle_statistics')) {
            Schema::table('vehicle_statistics', function (Blueprint $table) {
                if (!Schema::hasColumn('vehicle_statistics', 'data_source')) {
                    $table->string('data_source')->default('BASELINE');
                }
                if (!Schema::hasColumn('vehicle_statistics', 'learning_stage')) {
                    $table->unsignedTinyInteger('learning_stage')->default(1);
                }
                if (!Schema::hasColumn('vehicle_statistics', 'real_trips_count')) {
                    $table->unsignedInteger('real_trips_count')->default(0);
                }
                if (!Schema::hasColumn('vehicle_statistics', 'valid_trips_count')) {
                    $table->unsignedInteger('valid_trips_count')->default(0);
                }
                if (!Schema::hasColumn('vehicle_statistics', 'rejected_trips_count')) {
                    $table->unsignedInteger('rejected_trips_count')->default(0);
                }
                if (!Schema::hasColumn('vehicle_statistics', 'ml_ready')) {
                    $table->boolean('ml_ready')->default(false);
                }
            });
        }

        if (Schema::hasTable('driver_statistics')) {
            Schema::table('driver_statistics', function (Blueprint $table) {
                if (!Schema::hasColumn('driver_statistics', 'data_source')) {
                    $table->string('data_source')->default('BASELINE');
                }
                if (!Schema::hasColumn('driver_statistics', 'learning_stage')) {
                    $table->unsignedTinyInteger('learning_stage')->default(1);
                }
                if (!Schema::hasColumn('driver_statistics', 'real_trips_count')) {
                    $table->unsignedInteger('real_trips_count')->default(0);
                }
                if (!Schema::hasColumn('driver_statistics', 'valid_trips_count')) {
                    $table->unsignedInteger('valid_trips_count')->default(0);
                }
                if (!Schema::hasColumn('driver_statistics', 'rejected_trips_count')) {
                    $table->unsignedInteger('rejected_trips_count')->default(0);
                }
                if (!Schema::hasColumn('driver_statistics', 'ml_ready')) {
                    $table->boolean('ml_ready')->default(false);
                }
            });
        }

        if (Schema::hasTable('route_statistics')) {
            Schema::table('route_statistics', function (Blueprint $table) {
                if (!Schema::hasColumn('route_statistics', 'data_source')) {
                    $table->string('data_source')->default('BASELINE');
                }
                if (!Schema::hasColumn('route_statistics', 'learning_stage')) {
                    $table->unsignedTinyInteger('learning_stage')->default(1);
                }
                if (!Schema::hasColumn('route_statistics', 'real_trips_count')) {
                    $table->unsignedInteger('real_trips_count')->default(0);
                }
                if (!Schema::hasColumn('route_statistics', 'valid_trips_count')) {
                    $table->unsignedInteger('valid_trips_count')->default(0);
                }
                if (!Schema::hasColumn('route_statistics', 'ml_ready')) {
                    $table->boolean('ml_ready')->default(false);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive reverse
    }
};
