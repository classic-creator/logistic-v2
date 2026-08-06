<?php

namespace App\Jobs;

use App\Contracts\NotificationChannelInterface;
use App\Models\Notification;
use App\Models\NotificationDeliveryLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DeliverNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $notificationId;
    public int $deliveryLogId;

    public int $tries = 3;

    public function __construct(string $notificationId, int $deliveryLogId)
    {
        $this->notificationId = $notificationId;
        $this->deliveryLogId = $deliveryLogId;
    }

    public function handle(): void
    {
        $notification = Notification::find($this->notificationId);
        $log = NotificationDeliveryLog::find($this->deliveryLogId);

        if (!$notification || !$log) {
            return;
        }

        /** @var NotificationChannelInterface $channel */
        $channel = match ($log->channel) {
            'in_app' => new \App\Services\Channels\InAppChannel(),
            'browser_push' => new \App\Services\Channels\WebPushChannel(),
            default => new \App\Services\Channels\FutureChannelStub($log->channel),
        };

        $success = $channel->send($notification, $log);

        if (!$success && $this->attempts() < $this->tries) {
            $this->release(10 * $this->attempts());
        }
    }

    public function failed(\Throwable $exception): void
    {
        $log = NotificationDeliveryLog::find($this->deliveryLogId);
        if ($log) {
            $log->update([
                'status' => 'failed',
                'error_message' => $exception->getMessage(),
            ]);
        }
    }
}
