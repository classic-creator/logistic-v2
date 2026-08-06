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
        Schema::create('fuel_prices', function (Blueprint $table) {

            $table->id();
            $table->unsignedBigInteger("company_id")->nullable();
            $table->unsignedBigInteger("branch_id")->nullable();
            $table->string("state", 100)->nullable();
            $table->string("city", 80)->nullable();
            $table->string("fuel_type", 30)->default("Diesel");
            $table->decimal("price_per_liter", 10, 2);
            $table->date("effective_from")->nullable();
            $table->date("effective_to")->nullable();
            $table->boolean("is_active")->default(true);
            $table->string("source")->default("manual");
            $table->timestamps();

            $table->index(["company_id", "fuel_type"]);
            $table->index(["city", "fuel_type"]);

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fuel_prices');
    }
};
