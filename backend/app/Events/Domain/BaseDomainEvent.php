<?php

namespace App\Events\Domain;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

abstract class BaseDomainEvent
{
    use Dispatchable, SerializesModels;

    public ?int $companyId;
    public ?int $branchId;
    public ?int $actorId;
    public ?string $entityType;
    public mixed $entityId;
    public array $metadata;
    public string $occurredAt;

    public function __construct(
        ?int $companyId = null,
        ?int $branchId = null,
        ?int $actorId = null,
        ?string $entityType = null,
        mixed $entityId = null,
        array $metadata = []
    ) {
        $this->companyId = $companyId;
        $this->branchId = $branchId;
        $this->actorId = $actorId;
        $this->entityType = $entityType;
        $this->entityId = $entityId;
        $this->metadata = $metadata;
        $this->occurredAt = now()->toIso8601String();
    }

    abstract public function getEventKey(): string;

    abstract public function getCategory(): string;

    abstract public function getDefaultPriority(): string; // critical, high, medium, low

    abstract public function getNotificationTitle(): string;

    abstract public function getNotificationBody(): string;

    abstract public function getDeepLink(): ?string;

    /**
     * Target roles to receive this notification (e.g., ['company_admin', 'dispatcher', 'driver'])
     */
    public function getTargetRoles(): array
    {
        return ['company_admin', 'dispatcher', 'branch_manager'];
    }

    /**
     * Specific user IDs to target directly in addition to roles
     */
    public function getDirectUserIds(): array
    {
        return [];
    }

    public function getExpirationMinutes(): ?int
    {
        return 1440; // 24 hours default
    }

    public function toArray(): array
    {
        return [
            'event_key' => $this->getEventKey(),
            'category' => $this->getCategory(),
            'priority' => $this->getDefaultPriority(),
            'title' => $this->getNotificationTitle(),
            'body' => $this->getNotificationBody(),
            'deep_link' => $this->getDeepLink(),
            'company_id' => $this->companyId,
            'branch_id' => $this->branchId,
            'actor_id' => $this->actorId,
            'entity_type' => $this->entityType,
            'entity_id' => $this->entityId,
            'metadata' => $this->metadata,
            'occurred_at' => $this->occurredAt,
        ];
    }
}
