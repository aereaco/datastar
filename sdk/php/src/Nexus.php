<?php

namespace aereaco\nexus-ux;

use aereaco\nexus-ux\events\StateEvent;
use aereaco\nexus-ux\events\ExecuteScript;
use aereaco\nexus-ux\events\MergeFragments;
use aereaco\nexus-ux\events\MergeSignals;
use aereaco\nexus-ux\events\RemoveFragments;
use aereaco\nexus-ux\events\RemoveSignals;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NexusUX
{
    private array $events = [];
    public array $signals;

    public function __construct(array $signals = [])
    {
        $this->signals = $signals;
    }

    public function getResponse(): StreamedResponse
    {
        $response = new StreamedResponse();
        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('X-Accel-Buffering', 'no');

        $response->setCallback(function () {
            foreach ($this->events as $event) {
                echo $event;
                ob_flush();
                flush();
            }
        });

        return $response;
    }

    public function addEvent(StateEvent $event): void
    {
        $this->events[] = $event;
    }

    public function mergeFragments(string $content, array $options = []): void
    {
        $this->addEvent(new MergeFragments($content, $options));
    }

    public function removeFragments(string $selector, array $options = []): void
    {
        $this->addEvent(new RemoveFragments($selector, $options));
    }

    public function mergeSignals($content, array $options = []): void
    {
        $this->addEvent(new MergeSignals($content, $options));
    }

    public function removeSignals($paths, array $options = []): void
    {
        $this->addEvent(new RemoveSignals($paths, $options));
    }

    public function executeScript(string $content, array $options = []): void
    {
        $this->addEvent(new ExecuteScript($content, $options));
    }

    public function redirect(string $url): void
    {
        $this->executeScript("setTimeout(() => window.location = '{$url}')");
    }
}
