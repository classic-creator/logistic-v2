<?php

namespace App\Events\Domain;

class FuelEntrySubmittedEvent extends BaseDomainEvent
{
    public float $amount;

    public function __construct($fuelEntry, ?int $actorId = null)
    {
        $companyId = is_object($fuelEntry) ? ($fuelEntry->company_id ?? null) : null;
        $entityId = is_object($fuelEntry) ? ($fuelEntry->id ?? null) : $fuelEntry;
        $this->amount = is_object($fuelEntry) ? (float)($fuelEntry->total_cost ?? 0.0) : 0.0;

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
        return 'fuel.entry_submitted';
    }

    public function getCategory(): string
    {
        return 'fuel';
    }

    public function getDefaultPriority(): string
    {
        return 'medium';
    }

    public function getNotificationTitle(): string
    {
        return "Fuel Entry Submitted";
    }

    public function getNotificationBody(): string
    {
        return "A new fuel entry for $" . number_format($this->amount, 2) . " has been submitted for approval.";
    }

    public function getDeepLink(): ?string
    {
        return "/fuel";
    }
}
