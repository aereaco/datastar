[![Stable Version](https://img.shields.io/packagist/v/aereaco/nexus-ux-php?label=stable)]((https://packagist.org/packages/aereaco/nexus-ux-php))
[![Total Downloads](https://img.shields.io/packagist/dt/aereaco/nexus-ux-php)](https://packagist.org/packages/aereaco/nexus-ux-php)

<p align="center"><img width="150" src="https://putyourlightson.com/assets/logos/nexus-ux.svg"></p>

# Nexus-UX PHP SDK

This package provides a PHP SDK for working with [Nexus-UX](https://nexus.aerea.co/).

## License

This package is licensed for free under the MIT License.

## Requirements

This package requires PHP 8.1 or later.

## Installation

Install using composer.

```shell
composer require aereaco/nexus-ux-php
```

## Usage

```php
use aereaco
exus-ux
ums
EventType;
use aereaco
exus-ux
ums
FragmentMergeMode;
use aereaco
exus-ux
ServerSentEventGenerator;

// Creates a new `ServerSentEventGenerator` instance.
$sse = new ServerSentEventGenerator();

// Sends the response headers. 
// If your framework has its own way of sending response headers, manually send the headers returned by `ServerSentEventGenerator::headers()` instead.
$sse->sendHeaders();

// Merges HTML fragments into the DOM.
$sse->mergeFragments('<div></div>', [
    'selector' => '#my-div',
    'mergeMode' => FragmentMergeMode::Append,
    'useViewTransition' => true,
]);

// Removes HTML fragments from the DOM.
$sse->removeFragments('#my-div');

// Merges signals.
$sse->mergeSignals('{foo: 123}', [
    'onlyIfMissing' => true,
]);

// Removes signals.
$sse->removeSignals(['foo', 'bar']);

// Executes JavaScript in the browser.
$sse->executeScript('console.log("Hello, world!")');

// Redirects the browser by setting the location to the provided URI.
$sse->location('/guide');
```

```php
use aereaco
exus-ux
ServerSentEventGenerator;

$signals = ServerSentEventGenerator::readSignals();
```

```