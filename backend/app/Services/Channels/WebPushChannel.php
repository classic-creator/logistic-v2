<?php

namespace App\Services\Channels;

use App\Contracts\NotificationChannelInterface;
use App\Models\Notification;
use App\Models\NotificationDeliveryLog;
use App\Models\PushSubscription;
use App\Http\Controllers\NotificationController;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Illuminate\Support\Facades\Log;

class WebPushChannel implements NotificationChannelInterface
{
    public function getChannelKey(): string
    {
        return 'browser_push';
    }

    public function send(Notification $notification, NotificationDeliveryLog $log): bool
    {
        try {
            $subscriptions = PushSubscription::where('user_id', $notification->user_id)->get();

            if ($subscriptions->isEmpty()) {
                $log->update([
                    'status' => 'delivered',
                    'recipient_target' => 'No active push subscription',
                    'sent_at' => now(),
                    'delivered_at' => now(),
                ]);
                return true;
            }

            $vapidKeys = NotificationController::getOrGenerateVapidKeys();

            $auth = [
                'VAPID' => [
                    'subject' => 'mailto:admin@logistics.com',
                    'publicKey' => $vapidKeys['publicKey'],
                    'privateKey' => $vapidKeys['privateKey'],
                ],
            ];

            $webPush = new WebPush($auth);
            $webPush->setReuseVAPIDHeaders(true);

            $payload = json_encode([
                'title' => $notification->title,
                'body' => $notification->body,
                'priority' => $notification->priority,
                'category' => $notification->category,
                'icon' => '/favicon.svg',
                'badge' => '/favicon.svg',
                'data' => [
                    'notification_id' => $notification->id,
                    'deepLink' => $notification->deep_link,
                    'event_key' => $notification->event_key,
                ]
            ]);

            $successCount = 0;
            foreach ($subscriptions as $sub) {
                try {
                    $subscription = Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'publicKey' => $sub->p256dh_key,
                        'authToken' => $sub->auth_token,
                        'contentEncoding' => $sub->content_encoding ?: 'aesgcm',
                    ]);

                    $webPush->queueNotification($subscription, $payload);
                    $sub->update(['last_used_at' => now()]);
                    $successCount++;
                } catch (\Throwable $e) {
                    Log::warning("WebPush subscription queue warning for sub #{$sub->id}: " . $e->getMessage());
                }
            }

            // Flush pending web push notifications to browser push services (FCM/Mozilla/Apple)
            $reports = $webPush->flush();

            foreach ($reports as $report) {
                $endpoint = $report->getRequest()->getUri()->__toString();
                if (!$report->isSuccess()) {
                    Log::warning("Web Push delivery to endpoint {$endpoint} failed: {$report->getReason()}");
                    if ($report->isSubscriptionExpired()) {
                        PushSubscription::where('endpoint', $endpoint)->delete();
                    }
                }
            }

            $log->update([
                'status' => 'delivered',
                'sent_at' => now(),
                'delivered_at' => now(),
                'recipient_target' => "{$successCount} Push Device(s)",
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error("WebPush delivery failed: " . $e->getMessage());
            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'retry_count' => $log->retry_count + 1,
            ]);
            return false;
        }
    }
}
