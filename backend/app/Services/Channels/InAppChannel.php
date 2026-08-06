<?php

namespace App\Services\Channels;

use App\Contracts\NotificationChannelInterface;
use App\Models\Notification;
use App\Models\NotificationDeliveryLog;

class InAppChannel implements NotificationChannelInterface
{
    public function getChannelKey(): string
    {
        return 'in_app';
    }

    public function send(Notification $notification, NotificationDeliveryLog $log): bool
    {
        try {
            $log->update([
                'status' => 'delivered',
                'sent_at' => now(),
                'delivered_at' => now(),
                'recipient_target' => "User #{$notification->user_id}",
            ]);
            return true;
        } catch (\Throwable $e) {
            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
