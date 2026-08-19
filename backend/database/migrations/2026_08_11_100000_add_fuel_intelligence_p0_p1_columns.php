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
        // 1. Add distance_source and branch_id to trips table if not present
        Schema::table('trips', function (Blueprint $table) {
            if (!Schema::hasColumn('trips', 'distance_source')) {
                $table->string('distance_source', 50)->default('planned')->after('actual_distance');
            }
            if (!Schema::hasColumn('trips', 'branch_id')) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('id')->index();
            }
        });

        // 2. Add branch_id to vehicles, drivers, and orders tables if not present
        Schema::table('vehicles', function (Blueprint $table) {
            if (!Schema::hasColumn('vehicles', 'branch_id')) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('id')->index();
            }
        });

        Schema::table('drivers', function (Blueprint $table) {
            if (!Schema::hasColumn('drivers', 'branch_id')) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('id')->index();
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'branch_id')) {
                $table->unsignedBigInteger('branch_id')->nullable()->after('id')->index();
            }
        });

        // 3. Add prediction accuracy metrics to prediction_history table if not present
        if (Schema::hasTable('prediction_history')) {
            Schema::table('prediction_history', function (Blueprint $table) {
                if (!Schema::hasColumn('prediction_history', 'mape_percent')) {
                    $table->decimal('mape_percent', 8, 2)->nullable()->after('accuracy_score');
                }
                if (!Schema::hasColumn('prediction_history', 'absolute_error')) {
                    $table->decimal('absolute_error', 12, 2)->nullable()->after('mape_percent');
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
