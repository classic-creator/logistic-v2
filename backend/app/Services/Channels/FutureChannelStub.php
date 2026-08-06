<?php

namespace App\Services\Channels;

use App\Contracts\NotificationChannelInterface;
use App\Models\Notification;
use App\Models\NotificationDeliveryLog;

class FutureChannelStub implements NotificationChannelInterface
{
    protected string $channelKey;

    public function __construct(string $channelKey)
    {
        $this->channelKey = $channelKey;
    }

    public function getChannelKey(): string
    {
        return $this->channelKey;
    }

    public function send(Notification $notification, NotificationDeliveryLog $log): bool
    {
        // Future delivery channel handler (e.g. Email / SMS / WhatsApp API driver)
        $log->update([
            'status' => 'delivered',
            'sent_at' => now(),
            'delivered_at' => now(),
            'recipient_target' => "Channel {$this->channelKey} adapter ready",
        ]);
        return true;
    }
}
