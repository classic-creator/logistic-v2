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
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('event_key');
            $table->string('category')->default('system');
            $table->enum('priority', ['critical', 'high', 'medium', 'low'])->default('medium');
            $table->string('title');
            $table->text('body');
            $table->string('deep_link')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at', 'archived_at']);
            $table->index(['company_id', 'created_at']);
            $table->index(['priority', 'created_at']);
        });

        Schema::create('notification_delivery_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('notification_id')->constrained('notifications')->onDelete('cascade');
            $table->string('channel'); // in_app, browser_push, email, sms, whatsapp, slack, teams, webhook
            $table->enum('status', ['queued', 'sent', 'delivered', 'clicked', 'read', 'failed'])->default('queued');
            $table->string('recipient_target')->nullable(); // endpoint, email, phone, etc.
            $table->integer('retry_count')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
            $table->timestamps();

            $table->index(['notification_id', 'channel']);
            $table->index('status');
        });

        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('endpoint', 255);
            $table->text('p256dh_key');
            $table->text('auth_token');
            $table->string('content_encoding')->nullable()->default('aesgcm');
            $table->string('user_agent')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'endpoint']);
        });

        Schema::create('user_notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('category'); // trip, vehicle, driver, fuel, maintenance, finance, document, system
            $table->boolean('in_app_enabled')->default(true);
            $table->boolean('browser_push_enabled')->default(true);
            $table->boolean('email_enabled')->default(true);
            $table->boolean('whatsapp_enabled')->default(false);
            $table->time('quiet_hours_start')->nullable();
            $table->time('quiet_hours_end')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'category']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_notification_preferences');
        Schema::dropIfExists('push_subscriptions');
        Schema::dropIfExists('notification_delivery_logs');
        Schema::dropIfExists('notifications');
    }
};
