<?php

use aereaco\nexus-ux\events\StateEvent;

test('Event is correctly output', function() {
    $event = new StateEvent('event', 'data');
    expect($event->__toString())->toBe("event: event\ndata: data\n\n");
});

test('Options are correctly output', function() {
    $event = new StateEvent('event', 'data', ['id' => 'id', 'retry' => 1000]);
    expect($event->__toString())->toBe("id: id\nevent: event\nretry: 1000\ndata: data\n\n");
});

