<?php

namespace App\Events\Domain;

class FuelApprovedEvent extends BaseDomainEvent
{
    public float $amount;
    public string $fuelId;

    public function __construct($fuelEntry, ?int $actorId = null)
    {
        $companyId = is_object($fuelEntry) ? ($fuelEntry->company_id ?? null) : null;
        $entityId = is_object($fuelEntry) ? ($fuelEntry->id ?? null) : $fuelEntry;
        $this->amount = is_object($fuelEntry) ? (float)($fuelEntry->total_cost ?? 0.0) : 0.0;
        $this->fuelId = "FUEL-{$entityId}";

        parent::__construct(
            companyId: $companyId,
            actorId: $actorId,
            entityType: 'FuelEntry',
            entityId: $entityId,
            metadata: ['amount' => $this->amount]
        );
    }

    public function getEventKey(): string
    {
        return 'fuel.approved';
    }

    public function getCategory(): string
    {
        return 'fuel';
    }

    public function getDefaultPriority(): string
    {
        return 'high';
    }

    public function getNotificationTitle(): string
    {
        return "Fuel Expense Approved: {$this->fuelId}";
    }

    public function getNotificationBody(): string
    {
        return "Fuel receipt entry {$this->fuelId} for $" . number_format($this->amount, 2) . " has been approved.";
    }

    public function getDeepLink(): ?string
    {
        return "/fuel";
    }
}
