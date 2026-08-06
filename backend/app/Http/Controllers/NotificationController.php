<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\NotificationDeliveryLog;
use App\Models\PushSubscription;
use App\Models\UserNotificationPreference;
use App\Events\Domain\TripStartedEvent;
use App\Events\Domain\TripCreatedEvent;
use App\Events\Domain\TripCompletedEvent;
use App\Events\Domain\VehicleBreakdownEvent;
use App\Events\Domain\FuelApprovedEvent;
use App\Events\Domain\CustomAlertEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get paginated notifications with filters
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $query = Notification::where('user_id', $user->id)
            ->active();

        // Search title/body
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('body', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->filled('category') && $request->input('category') !== 'all') {
            $query->where('category', $request->input('category'));
        }

        // Priority filter
        if ($request->filled('priority') && $request->input('priority') !== 'all') {
            $query->where('priority', $request->input('priority'));
        }

        // Status filter (unread, archived, all)
        if ($request->input('status') === 'unread') {
            $query->unread();
        } elseif ($request->input('status') === 'archived') {
            $query->whereNotNull('archived_at');
        }

        $query->orderBy('created_at', 'desc');

        $notifications = $query->paginate($request->input('per_page', 20));

        $unreadCount = Notification::where('user_id', $user->id)
            ->active()
            ->unread()
            ->count();

        return response()->json([
            'status' => 'success',
            'data' => $notifications->items(),
            'pagination' => [
                'total' => $notifications->total(),
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
            ],
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['unread_count' => 0]);
        }

        $count = Notification::where('user_id', $user->id)
            ->active()
            ->unread()
            ->count();

        return response()->json([
            'status' => 'success',
            'unread_count' => $count,
        ]);
    }

    /**
     * Mark single notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $user = Auth::user();
        $notification = Notification::where('user_id', $user->id)->findOrFail($id);
        $notification->markAsRead();

        return response()->json([
            'status' => 'success',
            'message' => 'Notification marked as read',
            'data' => $notification,
        ]);
    }

    /**
     * Mark all notifications as read for current user
     */
    public function markAllRead(Request $request)
    {
        $user = Auth::user();
        Notification::where('user_id', $user->id)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json([
            'status' => 'success',
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Archive notification
     */
    public function archive(Request $request, $id)
    {
        $user = Auth::user();
        $notification = Notification::where('user_id', $user->id)->findOrFail($id);
        $notification->update(['archived_at' => now()]);

        return response()->json([
            'status' => 'success',
            'message' => 'Notification archived',
        ]);
    }

    /**
     * Delete notification
     */
    public function destroy(Request $request, $id)
    {
        $user = Auth::user();
        $notification = Notification::where('user_id', $user->id)->findOrFail($id);
        $notification->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Notification deleted',
        ]);
    }

    /**
     * Enterprise Delivery Logs & Audit Trail
     */
    public function deliveryLogs(Request $request)
    {
        $user = Auth::user();
        $logs = NotificationDeliveryLog::whereHas('notification', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->with('notification')
        ->orderBy('created_at', 'desc')
        ->paginate(30);

        return response()->json([
            'status' => 'success',
            'data' => $logs->items(),
            'pagination' => [
                'total' => $logs->total(),
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
            ]
        ]);
    }

    /**
     * Register Browser Push Subscription
     */
    public function pushSubscribe(Request $request)
    {
        $user = Auth::user();
        $request->validate([
            'endpoint' => 'required|string',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        $sub = PushSubscription::updateOrCreate(
            [
                'user_id' => $user->id,
                'endpoint' => $request->input('endpoint'),
            ],
            [
                'p256dh_key' => $request->input('keys.p256dh'),
                'auth_token' => $request->input('keys.auth'),
                'user_agent' => $request->header('User-Agent'),
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Push subscription registered successfully',
            'subscription' => $sub,
        ]);
    }

    /**
     * Unregister Browser Push Subscription
     */
    public function pushUnsubscribe(Request $request)
    {
        $user = Auth::user();
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        PushSubscription::where('user_id', $user->id)
            ->where('endpoint', $request->input('endpoint'))
            ->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Push subscription removed successfully',
        ]);
    }

    /**
     * Get or generate VAPID Key pair
     */
    public static function getOrGenerateVapidKeys(): array
    {
        return \Illuminate\Support\Facades\Cache::rememberForever('vapid_keys_cache_v2', function () {
            if (env('VAPID_PUBLIC_KEY') && env('VAPID_PRIVATE_KEY')) {
                return [
                    'publicKey' => env('VAPID_PUBLIC_KEY'),
                    'privateKey' => env('VAPID_PRIVATE_KEY'),
                ];
            }
            try {
                return \Minishlink\WebPush\VAPID::createVapidKeys();
            } catch (\Throwable $e) {
                // Valid 65-byte uncompressed P-256 EC VAPID Public & Private key pair
                return [
                    'publicKey' => 'BIDBlYWys58XtutVKU28ZrScHrg3SPY1OAxNvyPjCB6MeKoqC-3YOtVOTpBvc10Eg4gmUeLr8E00abEh_711OXY',
                    'privateKey' => 'JnQu95iT6Bxw1xXPUaZk5wLnZE-NaMa4QjwKENF34pk',
                ];
            }
        });
    }

    /**
     * Get VAPID Public Key for WebPush
     */
    public function getVapidPublicKey()
    {
        $keys = self::getOrGenerateVapidKeys();
        return response()->json([
            'status' => 'success',
            'public_key' => $keys['publicKey'],
        ]);
    }

    /**
     * Get user notification preferences
     */
    public function getPreferences(Request $request)
    {
        $user = Auth::user();
        $categories = ['trip', 'vehicle', 'driver', 'fuel', 'maintenance', 'finance', 'document', 'system'];
        
        $preferences = UserNotificationPreference::where('user_id', $user->id)->get()->keyBy('category');

        $result = [];
        foreach ($categories as $cat) {
            $pref = $preferences->get($cat);
            $result[] = [
                'category' => $cat,
                'in_app_enabled' => $pref ? $pref->in_app_enabled : true,
                'browser_push_enabled' => $pref ? $pref->browser_push_enabled : true,
                'email_enabled' => $pref ? $pref->email_enabled : true,
                'whatsapp_enabled' => $pref ? $pref->whatsapp_enabled : false,
                'quiet_hours_start' => $pref?->quiet_hours_start,
                'quiet_hours_end' => $pref?->quiet_hours_end,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }

    /**
     * Update user notification preferences
     */
    public function updatePreferences(Request $request)
    {
        $user = Auth::user();
        $items = $request->input('preferences', []);

        foreach ($items as $item) {
            if (empty($item['category'])) continue;

            UserNotificationPreference::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'category' => $item['category'],
                ],
                [
                    'in_app_enabled' => $item['in_app_enabled'] ?? true,
                    'browser_push_enabled' => $item['browser_push_enabled'] ?? true,
                    'email_enabled' => $item['email_enabled'] ?? true,
                    'whatsapp_enabled' => $item['whatsapp_enabled'] ?? false,
                    'quiet_hours_start' => $item['quiet_hours_start'] ?? null,
                    'quiet_hours_end' => $item['quiet_hours_end'] ?? null,
                ]
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Notification preferences updated successfully',
        ]);
    }

    /**
     * Trigger a test domain event for verification & testing
     */
    public function triggerTestEvent(Request $request)
    {
        $user = Auth::user();
        $type = $request->input('event_type', 'trip_started');
        $delay = $request->input('delay', false);

        if ($delay) {
            ignore_user_abort(true); // Allow script to continue even if browser tab closes
            set_time_limit(0);
            sleep(10); // Sleep for 10 seconds to allow user to close tab
        }

        switch ($type) {
            case 'vehicle_breakdown':
                event(new VehicleBreakdownEvent(1, 'Interstate Hwy 95, Mile 142', $user->id));
                break;
            case 'fuel_approved':
                event(new FuelApprovedEvent((object)['id' => 99, 'total_cost' => 450.75, 'company_id' => $user->company_id], $user->id));
                break;
            case 'trip_started':
            default:
                event(new TripStartedEvent((object)['id' => 125, 'trip_number' => 'TRP-000125', 'company_id' => $user->company_id], $user->id));
                break;
        }

        return response()->json([
            'status' => 'success',
            'message' => "Domain Event [{$type}] fired successfully on Laravel Event Bus!",
        ]);
    }
}
