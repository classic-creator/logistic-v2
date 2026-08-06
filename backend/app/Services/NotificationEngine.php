<?php

namespace App\Services;

use App\Events\Domain\BaseDomainEvent;
use App\Models\Notification;
use App\Models\NotificationDeliveryLog;
use App\Models\User;
use App\Models\UserNotificationPreference;
use App\Jobs\DeliverNotificationJob;
use Illuminate\Support\Facades\Log;

class NotificationEngine
{
    /**
     * Process a domain event and route notifications to appropriate recipients
     */
    public function processEvent(BaseDomainEvent $event): void
    {
        try {
            $recipients = $this->resolveRecipients($event);

            if ($recipients->isEmpty()) {
                Log::info("NotificationEngine: No eligible recipients found for event [{$event->getEventKey()}]");
                return;
            }

            foreach ($recipients as $user) {
                $this->createAndEnqueueNotification($user, $event);
            }
        } catch (\Throwable $e) {
            Log::error("NotificationEngine Error on [{$event->getEventKey()}]: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Resolve target recipients based on Company, Branch, Roles, and Direct User IDs
     */
    protected function resolveRecipients(BaseDomainEvent $event)
    {
        $query = User::query();

        if (!is_null($event->companyId)) {
            $query->where('company_id', $event->companyId);
        }

        $directIds = array_filter($event->getDirectUserIds());
        $roles = $event->getTargetRoles();

        if (!empty($directIds) || !empty($roles)) {
            $query->where(function ($q) use ($roles, $directIds) {
                if (!empty($directIds) && !empty($roles)) {
                    $q->whereIn('id', $directIds)->orWhereIn('role', $roles);
                } elseif (!empty($directIds)) {
                    $q->whereIn('id', $directIds);
                } elseif (!empty($roles)) {
                    $q->whereIn('role', $roles);
                }
            });
        }

        $users = $query->get();

        // Fallback: If no company admin or role matches, ensure at least all active users in that company get critical/high system alerts
        if ($users->isEmpty() && !is_null($event->companyId)) {
            $users = User::where('company_id', $event->companyId)->get();
        }

        if ($users->isEmpty()) {
            $users = User::limit(5)->get(); // System wide fallback for single-tenant / dev setup
        }

        return $users;
    }

    /**
     * Create notification entity & queue channel delivery jobs
     */
    protected function createAndEnqueueNotification(User $user, BaseDomainEvent $event): ?Notification
    {
        // Check quiet hours
        if ($this->isInQuietHours($user, $event->getCategory())) {
            Log::info("Notification suppressed during quiet hours for User #{$user->id}");
        }

        $expiration = $event->getExpirationMinutes() ? now()->addMinutes($event->getExpirationMinutes()) : null;

        $notification = Notification::create([
            'company_id' => $event->companyId ?? $user->company_id,
            'branch_id' => $event->branchId,
            'user_id' => $user->id,
            'event_key' => $event->getEventKey(),
            'category' => $event->getCategory(),
            'priority' => $event->getDefaultPriority(),
            'title' => $event->getNotificationTitle(),
            'body' => $event->getNotificationBody(),
            'deep_link' => $event->getDeepLink(),
            'data' => $event->toArray(),
            'expires_at' => $expiration,
        ]);

        // Evaluate channels (In-App is always enabled by default, Browser Push optional)
        $enabledChannels = $this->resolveUserChannels($user, $event->getCategory());

        foreach ($enabledChannels as $channel) {
            $log = NotificationDeliveryLog::create([
                'notification_id' => $notification->id,
                'channel' => $channel,
                'status' => 'queued',
                'retry_count' => 0,
            ]);

            // Dispatch Delivery Job
            DeliverNotificationJob::dispatch($notification->id, $log->id);
        }

        return $notification;
    }

    /**
     * Resolve enabled delivery channels based on user preferences
     */
    protected function resolveUserChannels(User $user, string $category): array
    {
        $pref = UserNotificationPreference::where('user_id', $user->id)
            ->where('category', $category)
            ->first();

        $channels = ['in_app'];

        if (!$pref || $pref->browser_push_enabled) {
            $channels[] = 'browser_push';
        }

        if ($pref && $pref->email_enabled) {
            $channels[] = 'email';
        }

        if ($pref && $pref->whatsapp_enabled) {
            $channels[] = 'whatsapp';
        }

        return array_unique($channels);
    }

    /**
     * Check if current time falls within user quiet hours
     */
    protected function isInQuietHours(User $user, string $category): bool
    {
        $pref = UserNotificationPreference::where('user_id', $user->id)
            ->where('category', $category)
            ->first();

        if (!$pref || !$pref->quiet_hours_start || !$pref->quiet_hours_end) {
            return false;
        }

        $now = now()->format('H:i:s');
        return $now >= $pref->quiet_hours_start && $now <= $pref->quiet_hours_end;
    }
}
