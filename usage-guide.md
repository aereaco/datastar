### **Nexus UX (Datastar) Core and Plugin Functionalities**

Nexus UX is a hypermedia framework that enables building reactive web applications with a server-side rendering philosophy, augmented by client-side reactivity. It achieves this by extending HTML with declarative `data-*` attributes, powered by a reactive signal system.

---

#### **Section 1: Core Nexus UX (Datastar) Concepts**

At its heart, Nexus UX provides a powerful set of primitives that enable its declarative approach.

**1. Signals and Reactivity**

*   **Concept:** Nexus UX uses a signal-based reactivity system (powered by Preact Signals). Signals are reactive primitives that hold a value. When a signal's value changes, any "effects" that depend on that signal automatically re-run. This forms the basis of all reactivity in the framework.
*   **Core API:**
    *   `signals.upsertIfMissing(path, defaultValue)`: Creates a new signal at a given dot-delimited path if it doesn't exist, or returns an existing one.
    *   `signals.setValue(path, value)`: Sets the value of a signal at a given path.
    *   `signals.value(path)`: Gets the current value of a signal.
    *   `signals.signal(path)`: Gets the `Signal` object itself (useful for direct manipulation or passing around).
    *   `effect(() => { ... })`: A function that creates a reactive "effect." Any signals accessed within this callback will be tracked, and the callback will re-execute whenever those signals change.
*   **Usage Example (Conceptual - typically used internally by plugins or in component scripts):**
    ```javascript
    // Inside a component's script or a plugin's onLoad
    // Assuming 'ctx' is the RuntimeContext
    const { signals, effect } = ctx;

    // Create a signal
    const { signal: myCounter } = signals.upsertIfMissing('app.counter', 0);

    // Create an effect that reacts to changes in myCounter
    effect(() => {
      console.log('Counter changed:', myCounter.value);
      // Update a DOM element based on the signal
      document.getElementById('display').textContent = `Count: ${myCounter.value}`;
    });

    // Change the signal's value (this will trigger the effect)
    signals.setValue('app.counter', 1);
    ```

**2. Expression Evaluation (`genRX`)**

*   **Concept:** Nexus UX allows developers to write JavaScript-like expressions directly in HTML attributes. The `genRX()` function (available on the `RuntimeContext`) compiles these attribute values into executable JavaScript functions that can reactively read signals and call actions.
*   **Core API:** `ctx.genRX(): () => <T>(...args: any[]) => T` - Returns a function that, when called, evaluates the attribute's expression.
*   **Usage Example (Internal to plugins):**
    ```javascript
    // Inside an AttributePlugin's onLoad function
    const { el, value, genRX, effect } = ctx;
    const reactiveExpression = genRX(); // Compiles the attribute's value into a reactive function

    effect(() => {
      const result = reactiveExpression(); // Evaluate the expression
      el.textContent = String(result); // Update DOM based on result
    });
    ```
    *   **Developer-facing usage:**
        ```html
        <div data-text="mySignal + 1"></div>
        <button data-on-click="@post('/api/submit', { data: $signals.formData })">Submit</button>
        ```

**3. DOM Walking (`applyToElement`)**

*   **Concept:** Nexus UX needs to scan the DOM to find and initialize its `data-*` attributes. This process is called "walking the DOM."
*   **Core API:** `ctx.applyToElement(element: HTMLElement)`: Recursively applies all registered attribute plugins to the given element and its descendants.
*   **Usage Example (Internal to plugins, especially `component.ts`):**
    ```javascript
    // Inside DatastarComponent's connectedCallback
    // After internal template is attached, apply Datastar to its content
    this._dsCtx.applyToElement(this.root as HTMLElement);
    ```

**4. Lifecycle Management**

*   **Concept:** Nexus UX provides hooks to run code at specific points in an element's lifecycle, both declaratively via attributes and imperatively within component scripts.
*   **Core API (Declarative):**
    *   `onLoad: (ctx: RuntimeContext) => OnRemovalFn | void`: The primary hook for `AttributePlugin`s, executed when the attribute is processed. Can return a cleanup function.
*   **Core API (Imperative - within `DatastarComponent`):**
    *   `connectedCallback()`: Native Custom Element hook, fires when element is inserted into DOM.
    *   `disconnectedCallback()`: Native Custom Element hook, fires when element is removed from DOM.
    *   `registerCleanup(fn: () => void)`: Method on `DatastarComponent` to register functions to run during `disconnectedCallback`.
    *   `contentReadyCallback()`: Custom hook on `DatastarComponent`, called after internal template is processed and Datastar attributes are applied.
*   **Usage Example:** See `data-component-connected`, `data-on-disconnect`, and `contentReadyCallback` in Section 3.

**5. Error Handling**

*   **Concept:** Nexus UX provides standardized ways to report runtime and initialization errors, often with metadata for debugging.
*   **Core API:**
    *   `runtimeErr(code, ctx, metadata)`: For errors occurring during attribute processing.
    *   `initErr(code, ctx, metadata)`: For errors during plugin initialization.
*   **Usage Example (Internal to plugins):**
    ```javascript
    // Example from text.ts
    if (!(el instanceof HTMLElement)) {
      runtimeErr('TextInvalidElement', ctx);
    }
    ```

---

#### **Section 2: Plugin Categories and Common Patterns**

Nexus UX plugins extend the core functionality and fall into three main categories:

**1. Attribute Plugins (`PluginType.Attribute`)**

*   **Purpose:** Extend HTML with new `data-*` attributes that add reactive behavior to elements.
*   **Common Patterns:**
    *   Implement `onLoad` to define the attribute's behavior.
    *   Often use `ctx.effect` to create reactive updates.
    *   Use `ctx.genRX()` to evaluate the attribute's value as an expression.
    *   May return a cleanup function from `onLoad` to dispose of event listeners or observers.
    *   Define `keyReq` and `valReq` to specify attribute syntax.

**2. Action Plugins (`PluginType.Action`)**

*   **Purpose:** Define reusable JavaScript functions that can be called from any Datastar expression (e.g., from `data-on` attributes or component scripts). They are globally available via `ds.actions.actionName()`.
*   **Common Patterns:**
    *   Implement a `fn` property that takes `ctx: RuntimeContext` and additional arguments.
    *   Often perform side effects (e.g., network requests, DOM manipulation).
    *   Are typically `async` if they involve asynchronous operations.

**3. Watcher Plugins (`PluginType.Watcher`)**

*   **Purpose:** Listen for global events (especially Server-Sent Events - SSEs) and perform actions across the application. They are initialized once globally.
*   **Common Patterns:**
    *   Implement `onGlobalInit` to set up global event listeners.
    *   Often use `datastarSSEEventWatcher` helper for SSEs.
    *   Perform broad, application-level logic.

---

#### **Section 3: Detailed Plugin List with Functionality and Usage Examples**

Here's a breakdown of each plugin, its functionality, and how it's typically used.

**A. Browser-Specific Attribute Plugins (`library/src/plugins/official/browser/attributes/`)**

1.  **`component.ts` (Our Plugin)**
    *   **Functionality:** Defines a powerful HTML-first component model. It dynamically defines custom elements, manages their lifecycle, handles reactive props (`data-signals-*`), executes component-scoped scripts, and supports both Light DOM and Shadow DOM for encapsulation.
    *   **Usage Example:**
        ```html
        <!-- In your main HTML -->
        <my-profile
          data-component="/components/profile.html"
          data-signals-userName="'Alice'"
          data-signals-userAge="30"
          data-component:connected="console.log('Component is ready!')"
          data-component:disconnected="console.log('Component is being removed.')"
          data-component:formAssociated
          data-component:fallback="<template><p>Failed to load profile.</p></template>"
        ></my-profile>

        <!-- In /components/profile.html -->
        <template shadowrootmode="open">
          <style>
            :host {
              display: block;
              border: 1px solid gray;
              padding: 1rem;
            }
          </style>
          <div data-signals-internalCount="0">
            <h3 data-text="$props.userName"></h3>
            <p data-text="$props.userAge"></p>
            <button data-on-click="$signals.internalCount.value++">
              Clicked <span data-text="$signals.internalCount"></span> times
            </button>
            <script type="module">
              // Access props passed into the component via the $props object
              console.log("User from props:", $props.userName);

              // Access signals defined within this component's template
              console.log("Initial internal count:", $signals.internalCount);

              // Define a component-scoped action
              export function resetCount() {
                $signals.internalCount.value = 0;
              }

              // Use component instance methods
              componentInstance.registerCleanup(() => {
                console.log("Cleanup function for my-profile is running!");
              });
            </script>
          </div>
        </template>
        ```

2.  **`customValidity.ts`**
    *   **Functionality:** Sets a custom validation message for form elements based on an expression.
    *   **Usage Example:**
        ```html
        <input type="text" data-custom-validity="mySignal.value ? '' : 'This field is required!'">
        ```

3.  **`onIntersect.ts`**
    *   **Functionality:** Executes an expression when an element intersects with the viewport. Supports modifiers like `once`, `half`, `full`.
    *   **Usage Example:**
        ```html
        <div data-on-intersect.once="mySignal.value = true">
          <!-- Content that loads when visible -->
        </div>
        ```

4.  **`onInterval.ts`**
    *   **Functionality:** Runs an expression repeatedly at a specified interval.
    *   **Usage Example:**
        ```html
        <div data-on-interval.duration.1s="myCounter.value++">
          <!-- Updates every second -->
        </div>
        ```

5.  **`onLoad.ts`**
    *   **Functionality:** Runs an expression once when the element is loaded and processed by Datastar. Supports a `delay` modifier.
    *   **Usage Example:**
        ```html
        <div data-on-load.delay.500ms="fetchInitialData()">
          <!-- Content that triggers data fetch after 500ms -->
        </div>
        ```

6.  **`onRaf.ts`**
    *   **Functionality:** Runs an expression on every animation frame (requestAnimationFrame).
    *   **Usage Example:**
        ```html
        <div data-on-raf="updateAnimation(mySignal.value)">
          <!-- Smooth animation updates -->
        </div>
        ```

7.  **`onSignalChange.ts`**
    *   **Functionality:** Executes an expression whenever a specified signal (or any signal if no key is provided) changes.
    *   **Usage Example:**
        ```html
        <div data-on-signal-change:mySignal="console.log('mySignal changed to', mySignal.value)"></div>
        <div data-on-signal-change="console.log('Any signal changed')"></div>
        ```

8.  **`persist.ts`**
    *   **Functionality:** Persists signals to local storage or session storage.
    *   **Usage Example:**
        ```html
        <div data-persist.session="mySignal">
          <!-- mySignal will be saved/loaded from session storage -->
        </div>
        <div data-persist="myOtherSignal">
          <!-- myOtherSignal will be saved/loaded from local storage -->
        </div>
        ```

9.  **`replaceUrl.ts`**
    *   **Functionality:** Replaces the current browser URL without a full page reload.
    *   **Usage Example:**
        ```html
        <button data-on-click="replaceUrl('/new-path')">Change URL</button>
        ```

10. **`scrollIntoView.ts`**
    *   **Functionality:** Scrolls the element into view with various options (smooth, instant, block/inline alignment).
    *   **Usage Example:**
        ```html
        <div id="target-element">Content</div>
        <button data-on-click="scrollIntoView('#target-element')">Scroll to Target</button>
        <div data-scroll-into-view.smooth.center>This element will scroll into view on load</div>
        ```

11. **`viewTransition.ts`**
    *   **Functionality:** Sets up a view transition name for an element, enabling smooth transitions with the View Transitions API.
    *   **Usage Example:**
        ```html
        <img src="..." data-view-transition="hero-image">
        ```

**B. Core Attribute Plugins (`library/src/plugins/official/core/attributes/`)**

1.  **`computed.ts`**
    *   **Functionality:** Defines a computed signal whose value is derived from other signals.
    *   **Usage Example:**
        ```html
        <div data-signals-firstName="'John'" data-signals-lastName="'Doe'"></div>
        <div data-computed:fullName="firstName + ' ' + lastName"></div>
        <p data-text="fullName"></p> <!-- Displays "John Doe" and updates if firstName/lastName change -->
        ```

2.  **`signals.ts`**
    *   **Functionality:** Directly sets or merges signal values.
    *   **Usage Example:**
        ```html
        <div data-signals:app.theme="'dark'"></div>
        <div data-signals="{ user: { name: 'Alice', id: 123 } }"></div>
        <div data-signals.ifmissing="{ app: { version: '1.0' } }"></div>
        ```

3.  **`star.ts`**
    *   **Functionality:** A special plugin that processes all `data-*` attributes on an element. It's the core mechanism that triggers other attribute plugins.
    *   **Usage Example:** (Implicitly used by the framework; not directly placed by developers)
        ```html
        <!-- The framework processes data-* attributes via the 'star' plugin -->
        <div data-text="mySignal"></div>
        ```

**C. DOM-Specific Attribute Plugins (`library/src/plugins/official/dom/attributes/`)**

1.  **`attr.ts`**
    *   **Functionality:** Reactively sets or removes an attribute on the element.
    *   **Usage Example:**
        ```html
        <button data-attr:disabled="mySignal.value === 0">Click Me</button>
        <div data-attr="{ 'aria-hidden': !isVisible, 'data-custom': 'value' }"></div>
        ```

2.  **`bind.ts`**
    *   **Functionality:** Provides two-way data binding between form input elements and signals.
    *   **Usage Example:**
        ```html
        <input type="text" data-bind="myInputSignal">
        <p>You typed: <span data-text="myInputSignal"></span></p>
        ```

3.  **`class.ts`**
    *   **Functionality:** Reactively adds or removes CSS classes based on an expression.
    *   **Usage Example:**
        ```html
        <div data-class:active="isActiveSignal"></div>
        <div data-class="{ 'highlight': isHighlighted, 'error': hasError }"></div>
        ```

4.  **`on.ts`**
    *   **Functionality:** Attaches event listeners to an element and executes an expression when the event fires. Supports various modifiers (e.g., `prevent`, `stop`, `once`, `debounce`, `throttle`, `window`, `outside`).
    *   **Usage Example:**
        ```html
        <button data-on-click="mySignal.value++">Increment</button>
        <form data-on-submit.prevent="submitForm()">
          <!-- Form that prevents default submission -->
        </form>
        <input type="text" data-on-input.debounce.300ms="search(this.value)">
        ```

5.  **`ref.ts`**
    *   **Functionality:** Stores a reference to the element itself in a signal.
    *   **Usage Example:**
        ```html
        <div id="myDiv" data-ref="myDivElementSignal"></div>
        <button data-on-click="myDivElementSignal.value.style.color = 'red'">Color Div</button>
        ```

6.  **`show.ts`**
    *   **Functionality:** Toggles the visibility of an element by setting its `display` CSS property to `none`.
    *   **Usage Example:**
        ```html
        <div data-show="isVisibleSignal">
          <!-- This content is shown/hidden based on isVisibleSignal -->
        </div>
        ```

7.  **`text.ts`**
    *   **Functionality:** Sets the text content of an element based on an expression.
    *   **Usage Example:**
        ```html
        <p>Hello, <span data-text="userName"></span>!</p>
        ```

**D. Backend Action Plugins (`library/src/plugins/official/backend/actions/`)**

These plugins facilitate interaction with a backend using Server-Sent Events (SSE).

1.  **`delete.ts`, `get.ts`, `patch.ts`, `post.ts`, `put.ts`**
    *   **Functionality:** Perform HTTP requests (DELETE, GET, PATCH, POST, PUT respectively) and handle responses via SSE. They are wrappers around the core `sse` function.
    *   **Usage Example:**
        ```html
        <button data-on-click="@post('/api/items', { name: 'New Item' })">Create Item</button>
        <div data-on-load="@get('/api/data', { headers: { 'X-Custom': 'Value' } })"></div>
        ```

2.  **`sse.ts` (Core SSE Function)**
    *   **Functionality:** Provides the underlying mechanism for Server-Sent Events, handling connection, retries, and message parsing.
    *   **Usage Example:** (Internal; used by `get`, `post`, etc.)

**E. Backend Watcher Plugins (`library/src/plugins/official/backend/watchers/`)**

These plugins listen for specific SSE events from the backend and perform corresponding DOM manipulations or signal updates.

1.  **`executeScript.ts`**
    *   **Functionality:** Executes JavaScript code received via an SSE event.
    *   **Usage Example (Backend sends):** `event:nexus-execute-script\ndata:script:console.log('Hello from SSE!');`

2.  **`mergeFragments.ts`**
    *   **Functionality:** Merges HTML fragments received via SSE into the DOM using Idiomorph, supporting various merge modes (morph, inner, outer, prepend, append, before, after, upsertAttributes).
    *   **Usage Example (Backend sends):**
        ```
        event:nexus-merge-fragments
        data:selector:#my-container
        data:mergeMode:morph
        data:fragments:<div id="my-container">New content</div>
        ```

3.  **`mergeSignals.ts`**
    *   **Functionality:** Merges signal values received via SSE into the client-side `SignalsRoot`.
    *   **Usage Example (Backend sends):**
        ```
        event:nexus-merge-signals
        data:signals:{"user.name":"Jane Doe", "app.status":"ready"}
        ```

4.  **`removeFragments.ts`**
    *   **Functionality:** Removes DOM elements identified by a selector, received via SSE.
    *   **Usage Example (Backend sends):**
        ```
        event:nexus-remove-fragments
        data:selector:.item-to-remove
        ```

5.  **`removeSignals.ts`**
    *   **Functionality:** Removes signals from the client-side `SignalsRoot` based on paths received via SSE.
    *   **Usage Example (Backend sends):**
        ```
        event:nexus-remove-signals
        data:paths:user.name\napp.status
        ```

**F. Logic Action Plugins (`library/src/plugins/official/logic/actions/`)**

These provide general-purpose utility functions.

1.  **`fit.ts`**
    *   **Functionality:** Clamps a value to a new range, optionally rounding or clamping.
    *   **Usage Example:**
        ```html
        <div data-on-click="myScaledValue = @fit(myRawValue, 0, 100, 0, 10, true, true)"></div>
        ```

2.  **`setAll.ts`**
    *   **Functionality:** Sets the value of all signals that match one or more space-separated paths (wildcards supported).
    *   **Usage Example:**
        ```html
        <button data-on-click="@setAll('form.input.*', '')">Clear All Form Inputs</button>
        ```

3.  **`toggleAll.ts`**
    *   **Functionality:** Toggles the boolean value of all signals that match one or more space-separated paths (wildcards supported).
    *   **Usage Example:**
        ```html
        <button data-on-click="@toggleAll('item.*.selected')">Toggle All Selected Items</button>
        ```

---

This detailed breakdown should provide a comprehensive understanding of all core and plugin functionalities within the Nexus UX (Datastar) codebase, along with their typical usage patterns.
