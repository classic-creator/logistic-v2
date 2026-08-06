<?php

namespace App\Events\Domain;

class TripStartedEvent extends BaseDomainEvent
{
    public string $tripNumber;
    public ?int $driverUserId;

    public function __construct($trip, ?int $actorId = null)
    {
        $companyId = is_object($trip) ? ($trip->company_id ?? null) : null;
        $entityId = is_object($trip) ? ($trip->id ?? null) : $trip;
        $this->tripNumber = is_object($trip) ? ($trip->trip_number ?? "TRP-{$entityId}") : "TRP-{$entityId}";
        $this->driverUserId = is_object($trip) && isset($trip->driver->user_id) ? $trip->driver->user_id : null;

        parent::__construct(
            companyId: $companyId,
            actorId: $actorId,
            entityType: 'Trip',
            entityId: $entityId,
            metadata: ['trip_number' => $this->tripNumber]
        );
    }

    public function getEventKey(): string
    {
        return 'trip.started';
    }

    public function getCategory(): string
    {
        return 'trip';
    }

    public function getDefaultPriority(): string
    {
        return 'medium';
    }

    public function getNotificationTitle(): string
    {
        return "Trip Started: {$this->tripNumber}";
    }

    public function getNotificationBody(): string
    {
        return "Trip {$this->tripNumber} has officially started and is en route.";
    }

    public function getDeepLink(): ?string
    {
        return "/trips/{$this->entityId}";
    }

    public function getDirectUserIds(): array
    {
        return array_filter([$this->driverUserId]);
    }
}
