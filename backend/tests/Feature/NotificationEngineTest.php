<?php

namespace Tests\Feature;

use App\Events\Domain\TripStartedEvent;
use App\Events\Domain\VehicleBreakdownEvent;
use App\Events\Domain\FuelApprovedEvent;
use App\Events\Domain\UserLoggedInEvent;
use App\Models\Company;
use App\Models\Notification;
use App\Models\NotificationDeliveryLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationEngineTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::firstOrCreate(
            ['id' => 1],
            ['name' => 'Logistics Corp']
        );

        $this->user = User::firstOrCreate(
            ['email' => 'admin@logistics.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password'),
                'company_id' => $this->company->id,
                'role' => 'company_admin',
            ]
        );
    }

    public function test_domain_event_creates_notification_and_delivery_logs()
    {
        event(new TripStartedEvent((object)[
            'id' => 999,
            'trip_number' => 'TRP-000999',
            'company_id' => $this->company->id,
        ], $this->user->id));

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->user->id,
            'event_key' => 'trip.started',
            'category' => 'trip',
            'priority' => 'medium',
        ]);

        $notification = Notification::where('event_key', 'trip.started')->first();
        $this->assertNotNull($notification);

        $this->assertDatabaseHas('notification_delivery_logs', [
            'notification_id' => $notification->id,
            'channel' => 'in_app',
        ]);
    }

    public function test_critical_vehicle_breakdown_event()
    {
        event(new VehicleBreakdownEvent(1, 'Hwy 101, Marker 45', $this->user->id));

        $notification = Notification::where('event_key', 'vehicle.breakdown')->first();
        $this->assertNotNull($notification);
        $this->assertEquals('critical', $notification->priority);
    }

    public function test_notifications_api_endpoints()
    {
        $this->actingAs($this->user);

        // Trigger test event
        $response = $this->postJson('/api/v1/notifications/trigger-test-event', [
            'event_type' => 'trip_started'
        ]);
        $response->assertStatus(200);

        // Get index
        $indexRes = $this->getJson('/api/v1/notifications');
        $indexRes->assertStatus(200)
            ->assertJsonStructure(['status', 'data', 'unread_count']);

        // Get unread count
        $countRes = $this->getJson('/api/v1/notifications/unread-count');
        $countRes->assertStatus(200)
            ->assertJson(['status' => 'success']);

        // Get delivery logs
        $logsRes = $this->getJson('/api/v1/notifications/logs');
        $logsRes->assertStatus(200);

        // Push subscription endpoint
        $pushRes = $this->postJson('/api/v1/notifications/push-subscribe', [
            'endpoint' => 'https://push.example.com/sub/12345',
            'keys' => [
                'p256dh' => 'test_p256dh_key',
                'auth' => 'test_auth_token',
            ]
        ]);
        $pushRes->assertStatus(200);
    }
}
