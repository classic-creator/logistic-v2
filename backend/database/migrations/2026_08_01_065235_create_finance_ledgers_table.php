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
        Schema::create('finance_ledgers', function (Blueprint $table) {

            $table->id();
            $table->unsignedBigInteger("trip_id")->nullable();
            $table->unsignedBigInteger("company_id")->nullable();
            $table->string("invoice_number")->nullable();
            $table->decimal("trip_amount", 10, 2)->nullable();
            $table->decimal("diesel_expense", 10, 2)->nullable();
            $table->decimal("toll_expense", 10, 2)->nullable();
            $table->decimal("driver_allowance", 10, 2)->nullable();
            $table->decimal("loading_charge", 10, 2)->nullable();
            $table->decimal("unloading_charge", 10, 2)->nullable();
            $table->decimal("other_expenses", 10, 2)->nullable();
            $table->decimal("payment_received", 10, 2)->nullable();
            $table->decimal("total_expenses", 10, 2)->nullable();
            $table->decimal("net_profit", 10, 2)->nullable();
            $table->decimal("pending_amount", 10, 2)->nullable();
            $table->decimal("profit_margin", 8, 4)->nullable();
            $table->string("status", 20)->default("Pending");
            $table->text("remarks")->nullable();
            $table->timestamp("recorded_at")->nullable();
            $table->timestamps();
            $table->softDeletes();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('finance_ledgers');
    }
};
