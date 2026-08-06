<?php

namespace App\Contracts;

use App\Models\Notification;
use App\Models\NotificationDeliveryLog;

interface NotificationChannelInterface
{
    /**
     * Get unique channel key (e.g., 'in_app', 'browser_push', 'email', 'whatsapp', 'sms')
     */
    public function getChannelKey(): string;

    /**
     * Deliver the notification and update the delivery log status
     */
    public function send(Notification $notification, NotificationDeliveryLog $log): bool;
}
