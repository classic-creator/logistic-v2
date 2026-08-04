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
        Schema::create('trip_tracking_points', function (Blueprint $table) {

            $table->id();
            $table->unsignedBigInteger("trip_id");
            $table->decimal("latitude", 10, 7);
            $table->decimal("longitude", 10, 7);
            $table->timestamp("timestamp");
            $table->timestamps();
            $table->softDeletes();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trip_tracking_points');
    }
};
