<?php

namespace App\Events\Domain;

class VehicleBreakdownEvent extends BaseDomainEvent
{
    public string $vehicleRegistration;
    public string $location;

    public function __construct($vehicle, string $location = 'Unknown Location', ?int $actorId = null)
    {
        $companyId = is_object($vehicle) ? ($vehicle->company_id ?? null) : null;
        $entityId = is_object($vehicle) ? ($vehicle->id ?? null) : $vehicle;
        $this->vehicleRegistration = is_object($vehicle) ? ($vehicle->registration_number ?? "VEH-{$entityId}") : "VEH-{$entityId}";
        $this->location = $location;

        parent::__construct(
            companyId: $companyId,
            actorId: $actorId,
            entityType: 'Vehicle',
            entityId: $entityId,
            metadata: ['registration' => $this->vehicleRegistration, 'location' => $location]
        );
    }

    public function getEventKey(): string
    {
        return 'vehicle.breakdown';
    }

    public function getCategory(): string
    {
        return 'vehicle';
    }

    public function getDefaultPriority(): string
    {
        return 'critical';
    }

    public function getNotificationTitle(): string
    {
        return "CRITICAL ALERT: Vehicle Breakdown ({$this->vehicleRegistration})";
    }

    public function getNotificationBody(): string
    {
        return "Vehicle {$this->vehicleRegistration} reported a breakdown at {$this->location}. Immediate maintenance dispatch required.";
    }

    public function getDeepLink(): ?string
    {
        return "/fleet/vehicles/{$this->entityId}";
    }

    public function getTargetRoles(): array
    {
        return ['company_admin', 'dispatcher', 'fleet_manager', 'maintenance_manager'];
    }
}
