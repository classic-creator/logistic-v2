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
        Schema::create('companies', function (Blueprint $table) {

            $table->id();
            $table->string("name");
            $table->string("gst")->nullable();
            $table->text("address")->nullable();
            $table->string("contact_person")->nullable();
            $table->string("phone")->nullable();
            $table->string("email")->nullable();
            $table->string("payment_terms")->nullable();
            $table->string("status")->default("Active");
            $table->timestamps();
            $table->softDeletes();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
