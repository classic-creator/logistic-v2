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
        Schema::create('orders', function (Blueprint $table) {

            $table->id();
            $table->unsignedBigInteger("company_id")->nullable();
            $table->string("pickup_location")->nullable();
            $table->string("destination")->nullable();
            $table->string("pickup_place_id")->nullable();
            $table->string("destination_place_id")->nullable();
            $table->decimal("pickup_latitude", 10, 7)->nullable();
            $table->decimal("pickup_longitude", 10, 7)->nullable();
            $table->decimal("destination_latitude", 10, 7)->nullable();
            $table->decimal("destination_longitude", 10, 7)->nullable();
            $table->string("route_source")->nullable();
            $table->decimal("route_distance_km", 8, 2)->nullable();
            $table->string("route_distance_text")->nullable();
            $table->decimal("route_duration_hours", 8, 2)->nullable();
            $table->string("route_duration_text")->nullable();
            $table->string("material")->nullable();
            $table->string("weight")->nullable();
            $table->string("vehicle_type_required")->nullable();
            $table->decimal("expected_price", 10, 2)->nullable();
            $table->string("priority")->default("Medium");
            $table->string("delivery_date")->nullable();
            $table->text("notes")->nullable();
            $table->string("status")->default("Pending");
            $table->timestamps();
            $table->softDeletes();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
