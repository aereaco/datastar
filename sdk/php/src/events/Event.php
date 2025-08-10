<?php

namespace aereaco\nexus-ux\events;

class StateEvent
{
    public string $event;
    public string $data;
    public ?string $id = null;
    public ?int $retry = null;

    public function __construct(string $event, string $data, array $options = [])
    {
        $this->event = $event;
        $this->data = $data;

        foreach ($options as $key => $value) {
            $this->$key = $value;
        }
    }

    public function __toString(): string
    {
        $output = [];

        if ($this->id) {
            $output[] = "id: {$this->id}";
        }

        $output[] = "event: {$this->event}";

        if ($this->retry) {
            $output[] = "retry: {$this->retry}";
        }

        $output[] = "data: {$this->data}";

        return implode("\n", $output) . "\n\n";
    }
}
