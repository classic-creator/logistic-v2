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
        Schema::create('fuel_entries', function (Blueprint $table) {

            $table->id();
            $table->unsignedBigInteger("trip_id")->nullable();
            $table->unsignedBigInteger("company_id")->nullable();
            $table->unsignedBigInteger("branch_id")->nullable();
            $table->unsignedBigInteger("vehicle_id")->nullable();
            $table->unsignedBigInteger("driver_id")->nullable();

            $table->string("fuel_type")->default("Diesel");
            $table->decimal("quantity", 10, 2)->nullable();
            $table->decimal("unit_price", 10, 2)->nullable();
            $table->decimal("total_cost", 10, 2)->nullable();
            $table->decimal("odometer", 12, 2)->nullable();
            $table->string("station_name")->nullable();
            $table->string("payment_method")->default("Cash");
            $table->text("remarks")->nullable();
            $table->string("receipt_path")->nullable();

            $table->decimal("latitude", 10, 7)->nullable();
            $table->decimal("longitude", 10, 7)->nullable();
            $table->timestamp("filled_at")->nullable();

            $table->string("status")->default("Pending");
            $table->string("source")->default("driver");
            $table->boolean("is_flagged")->default(false);
            $table->json("flags")->nullable();
            $table->unsignedBigInteger("approved_by")->nullable();
            $table->timestamp("approved_at")->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index("trip_id");
            $table->index("vehicle_id");
            $table->index("driver_id");
            $table->index("status");
            $table->index("filled_at");

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fuel_entries');
    }
};
