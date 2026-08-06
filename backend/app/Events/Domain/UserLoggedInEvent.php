<?php

namespace App\Events\Domain;

class UserLoggedInEvent extends BaseDomainEvent
{
    public string $userName;
    public string $userEmail;

    public function __construct($user, ?string $ipAddress = null)
    {
        $companyId = is_object($user) ? ($user->company_id ?? null) : null;
        $entityId = is_object($user) ? ($user->id ?? null) : $user;
        $this->userName = is_object($user) ? ($user->name ?? 'User') : 'User';
        $this->userEmail = is_object($user) ? ($user->email ?? '') : '';

        parent::__construct(
            companyId: $companyId,
            actorId: $entityId,
            entityType: 'User',
            entityId: $entityId,
            metadata: ['email' => $this->userEmail, 'ip' => $ipAddress]
        );
    }

    public function getEventKey(): string
    {
        return 'user.logged_in';
    }

    public function getCategory(): string
    {
        return 'system';
    }

    public function getDefaultPriority(): string
    {
        return 'low';
    }

    public function getNotificationTitle(): string
    {
        return "Security Notice: User Login";
    }

    public function getNotificationBody(): string
    {
        return "Account {$this->userEmail} logged in to ERP platform.";
    }

    public function getDeepLink(): ?string
    {
        return "/settings";
    }

    public function getDirectUserIds(): array
    {
        return array_filter([$this->entityId]);
    }
}
