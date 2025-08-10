<?php

use aereaco\nexus-ux\NexusUX;

if (!function_exists('nexus')) {
    function nexus(array $signals = []): NexusUX
    {
        return new NexusUX($signals);
    }
}

