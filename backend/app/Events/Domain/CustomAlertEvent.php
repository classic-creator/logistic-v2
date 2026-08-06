<?php

namespace App\Events\Domain;

class CustomAlertEvent extends BaseDomainEvent
{
    public string $title;
    public string $body;
    public string $eventCategory;
    public string $eventPriority;
    public ?string $link;
    public array $roles;
    public array $userIds;

    public function __construct(
        string $title,
        string $body,
        string $category = 'system',
        string $priority = 'medium',
        ?string $deepLink = null,
        ?int $companyId = null,
        array $roles = ['company_admin'],
        array $userIds = [],
        ?int $actorId = null
    ) {
        $this->title = $title;
        $this->body = $body;
        $this->eventCategory = $category;
        $this->eventPriority = $priority;
        $this->link = $deepLink;
        $this->roles = $roles;
        $this->userIds = $userIds;

        parent::__construct(
            companyId: $companyId,
            actorId: $actorId,
            entityType: 'CustomAlert',
            metadata: ['custom' => true]
        );
    }

    public function getEventKey(): string
    {
        return 'custom.alert';
    }

    public function getCategory(): string
    {
        return $this->eventCategory;
    }

    public function getDefaultPriority(): string
    {
        return $this->eventPriority;
    }

    public function getNotificationTitle(): string
    {
        return $this->title;
    }

    public function getNotificationBody(): string
    {
        return $this->body;
    }

    public function getDeepLink(): ?string
    {
        return $this->link ?? '/dashboard';
    }

    public function getTargetRoles(): array
    {
        return $this->roles;
    }

    public function getDirectUserIds(): array
    {
        return $this->userIds;
    }
}
