<?php

namespace App\Listeners;

use App\Events\Domain\BaseDomainEvent;
use App\Services\NotificationEngine;

class ProcessDomainEventListener
{
    protected NotificationEngine $engine;

    public function __construct(NotificationEngine $engine)
    {
        $this->engine = $engine;
    }

    public function handle(BaseDomainEvent $event): void
    {
        $this->engine->processEvent($event);
    }
}
