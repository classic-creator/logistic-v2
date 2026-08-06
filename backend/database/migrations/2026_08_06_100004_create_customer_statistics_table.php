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
        Schema::create('customer_statistics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->unique();
            $table->unsignedInteger('total_trips')->default(0);
            $table->decimal('total_distance_km', 12, 2)->default(0);
            $table->decimal('total_fuel_cost', 12, 2)->default(0);
            $table->decimal('avg_revenue_per_trip', 12, 2)->default(0);
            $table->decimal('avg_profit_per_trip', 12, 2)->default(0);
            $table->decimal('avg_cost_per_km', 6, 2)->default(0);
            $table->string('most_used_route', 255)->nullable();
            $table->unsignedTinyInteger('customer_fuel_score')->default(50);
            $table->timestamp('last_calculated_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_statistics');
    }
};
