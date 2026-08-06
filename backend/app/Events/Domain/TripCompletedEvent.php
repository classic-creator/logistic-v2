<?php

namespace App\Events\Domain;

class TripCompletedEvent extends BaseDomainEvent
{
    public string $tripNumber;

    public function __construct($trip, ?int $actorId = null)
    {
        $companyId = is_object($trip) ? ($trip->company_id ?? null) : null;
        $entityId = is_object($trip) ? ($trip->id ?? null) : $trip;
        $this->tripNumber = is_object($trip) ? ($trip->trip_number ?? "TRP-{$entityId}") : "TRP-{$entityId}";

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
        return 'trip.completed';
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
        return "Trip Completed: {$this->tripNumber}";
    }

    public function getNotificationBody(): string
    {
        return "Trip {$this->tripNumber} has been successfully completed and POD uploaded.";
    }

    public function getDeepLink(): ?string
    {
        return "/trips/{$this->entityId}";
    }
}
