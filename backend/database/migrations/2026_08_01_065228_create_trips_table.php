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
        Schema::create('trips', function (Blueprint $table) {

            $table->id();
            $table->unsignedBigInteger("order_id")->nullable();
            $table->unsignedBigInteger("company_id")->nullable();
            $table->unsignedBigInteger("vehicle_id")->nullable();
            $table->unsignedBigInteger("driver_id")->nullable();
            
            $table->string("company_name")->nullable();
            $table->string("driver_name")->nullable();
            $table->string("vehicle_number")->nullable();
            $table->string("pickup_location")->nullable();
            $table->string("destination")->nullable();
            
            $table->text("pickup_coordinates")->nullable();
            $table->text("destination_coordinates")->nullable();
            $table->string("pickup_place_id")->nullable();
            $table->string("destination_place_id")->nullable();
            $table->string("route_source")->nullable();
            $table->string("route_distance_text")->nullable();
            $table->string("route_duration_text")->nullable();
            
            $table->string("material")->nullable();
            $table->string("weight")->nullable();
            $table->decimal("distance", 8, 2)->nullable();
            $table->decimal("estimated_duration", 8, 2)->nullable();
            
            $table->string("pickup_date")->nullable();
            $table->string("delivery_date")->nullable();
            $table->timestamp("start_date")->nullable();
            $table->timestamp("end_date")->nullable();
            $table->text("remarks")->nullable();
            $table->string("status")->default("Running");
            $table->timestamps();
            $table->softDeletes();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
