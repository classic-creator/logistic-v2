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
        Schema::create('learning_history', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type', 20); // 'vehicle', 'driver', 'route'
            $table->unsignedBigInteger('entity_id');
            $table->decimal('previous_mileage', 6, 2);
            $table->decimal('new_mileage', 6, 2);
            $table->decimal('confidence_score', 3, 2);
            $table->unsignedInteger('data_points_used');
            $table->decimal('weight_decay_factor', 4, 3)->default(0.850);
            $table->string('trigger', 30); // 'trip_completed', 'manual', 'recalc'
            $table->foreignId('trip_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
            
            $table->index(['entity_type', 'entity_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('learning_history');
    }
};
