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
        Schema::create('vehicles', function (Blueprint $table) {

            $table->id();
            $table->string("number");
            $table->string("type")->nullable();
            $table->string("capacity")->nullable();
            $table->string("fuel_type")->nullable();
            $table->string("rc")->nullable();
            $table->string("insurance")->nullable();
            $table->string("fitness")->nullable();
            $table->string("pollution")->nullable();
            $table->string("gps_id")->nullable();
            $table->string("permit")->nullable();
            $table->string("status")->default("Available");
            $table->timestamps();
            $table->softDeletes();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
