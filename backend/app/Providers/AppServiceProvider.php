<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        \Illuminate\Support\Facades\Event::listen('*', function ($eventName, array $data) {
            $event = $data[0] ?? null;
            if ($event instanceof \App\Events\Domain\BaseDomainEvent) {
                app(\App\Services\NotificationEngine::class)->processEvent($event);
            }
        });
    }
}
