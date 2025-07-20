# `component.ts`: A Deep Dive

The `component.ts` plugin is a cornerstone of building larger, more organized applications with Nexus UX. It provides a powerful, HTML-first component model that allows you to create reusable, encapsulated, and stateful UI pieces using simple HTML attributes and templates.

This guide provides a detailed overview of how to utilize the `data-component` attribute, covering both its declarative HTML API and its imperative JavaScript API.

## Overview

The primary goal of the `component.ts` plugin is to turn any element with a `data-component` attribute into a custom element on the fly. It handles:

- **Template Loading**: Fetches component templates from external files or inline strings.
- **Scope Isolation**: Creates a private, reactive state (signals) for each component instance.
- **Reactive Props**: Passes data from a parent scope into the component as reactive properties.
- **DOM Encapsulation**: Supports both Light DOM and Shadow DOM for style and structure isolation.
- **Lifecycle Hooks**: Provides declarative and imperative ways to run code when a component is created, connected, or destroyed.
- **Scoped Logic**: Allows for component-specific JavaScript and actions that don't pollute the global scope.

---

## Declarative Usage (The HTML API)

This is how you use and configure components directly within your HTML.

### `data-component`

This is the main attribute that activates the plugin. It accepts either a URL to an external HTML file or an inline HTML string. **Crucially, the content for both external and inline sources must be encapsulated within a top-level `<template>` tag.**

```html
<!-- 1. External Template -->
<user-card data-component="/components/user-card.html"></user-card>

<!-- 2. Inline Template -->
<item-counter data-component="<template>...</template>"></item-counter>
```

### Passing Reactive Props (`data-signals-*`)

You can pass reactive data from the parent scope into a component using `data-signals-*` attributes on the host element. These become available inside the component via the `$props` object.

```html
<!-- Parent Scope -->
<div data-signals-current-user-name="'Alice'">
  <user-profile data-signals-name="$currentUserName" data-signals-age="30"></user-profile>
</div>

<!-- Inside user-profile component template -->
<p>Name: <span data-text="$props.name"></span></p> <!-- Renders "Alice" -->
<p>Age: <span data-text="$props.age"></span></p>   <!-- Renders "30" -->
```

### Declarative Lifecycle Hooks

You can run expressions at key moments in the component's lifecycle using keys.

- **`data-component:connected`**: Executes when the component is fully initialized and connected to the DOM.
- **`data-component:disconnected`**: Executes just before the component is removed from the DOM.

```html
<my-widget
  data-component="..."
  data-component:connected="console.log('Widget is ready!')"
  data-component:disconnected="console.log('Widget is being removed.')"
></my-widget>
```

### Error Handling (`data-component:fallback`)

If an external component template fails to load, you can provide fallback HTML to render instead. Just like `data-component`, the value can be an external URL or an inline string, and **it must be encapsulated in a `<template>` tag.**

```html
<user-card
  data-component="/path/to/non-existent-file.html"
  data-component:fallback="<template><p style='color: red;'>Could not load user card.</p></template>"
></user-card>
```

### Template Configuration (Inside the component's HTML file)

The `<template>` tag within your component's HTML file can be configured with special attributes.

- **`shadowroot="open|closed"`**: Controls DOM encapsulation.
  - `open`: Creates an open Shadow DOM. The component's styles and structure are encapsulated, but the shadow root is accessible from outside JavaScript.
  - `closed`: Creates a closed Shadow DOM for complete encapsulation.
  - *No attribute*: The component will use the Light DOM, and its content will be rendered directly inside the host element.

### Form-Associated Components (`data-component:formAssociated`)

To make your component compatible with the native `<form>` element (allowing it to hold a value, be validated, and participate in form submission), add the `data-component:formAssociated` attribute to the **host element**. This is a boolean attribute; its presence enables the feature.

```html
<!-- Host element with the formAssociated key -->
<my-form-input
  data-component="/components/my-form-input.html"
  data-component:formAssociated
></my-form-input>
```

---

## Imperative Usage (The `<script>` API)

For more complex logic, you can include a `<script type="module">` inside your component's `<template>`. This script runs in a special, isolated scope.

### Scoped Context Variables

Within the component's script, you have access to several "magic" variables:

- **`componentInstance`**: The `DatastarComponent` instance itself. This is your primary tool for imperative logic.
- **`$signals`**: A proxy to the component's private, reactive state. Any signals defined inside the component template are accessed here (e.g., `$signals.internalCounter`).
- **`$props`**: A reactive object containing the properties passed into the component via `data-signals-*` attributes.
- **`$actions`**: An object containing all component-scoped actions defined with `export function`.
- **`ds`**: The global Nexus UX context, for advanced use cases like manually applying plugins.

### Defining Scoped Actions

Functions exported from the component's script automatically become component-scoped actions, callable only from within the component's template.

```html
<!-- Inside component template -->
<button data-on-click="@increment()">Increment</button>

<script type="module">
  export function increment() {
    $signals.counter++;
  }
</script>
```

### The `componentInstance` API

The `componentInstance` object provides several powerful methods:

- **`registerCleanup(fn)`**: Registers a function to be called when the component is disconnected. Essential for cleaning up event listeners, timers, or other resources.
  ```javascript
  const timerId = setInterval(() => console.log('tick'), 1000);
  componentInstance.registerCleanup(() => clearInterval(timerId));
  ```

- **`emit('event-name', detail)`**: Dispatches a custom event from the component, allowing it to communicate with parent elements.
  ```javascript
  // Inside component script
  export function notifyParent() {
    componentInstance.emit('user-updated', { id: 123, name: $props.name });
  }
  // Parent listening for the event
  // <my-component data-on-user-updated="handleUpdate($event.detail)"></my-component>
  ```

- **`generateScopedId('base-id')`**: Creates a unique ID for an element within the component, preventing ID conflicts when multiple instances are on the page.

- **`setCssVariable('--name', 'value')`** and **`getCssVariable('--name')`**: Imperatively manage CSS Custom Properties on the host element.

### Imperative Lifecycle Hook (`contentReadyCallback`)

This method on `componentInstance` is the ideal place to run initialization code. It is called *after* the component's template has been attached and all Nexus UX attributes within it have been fully processed and are reactive.

```javascript
// Inside component script
componentInstance.contentReadyCallback = () => {
  // The component's internal DOM is fully interactive here.
  const internalButton = componentInstance.root.querySelector('button');
  console.log('Component is fully ready!', internalButton);
};
```