## Technical Report: Nexus UX Core Library (`library/`)

### Introduction to Nexus UX

Nexus UX is a hypermedia framework designed to build reactive web applications. It aims to combine the simplicity of server-side rendering with the dynamic capabilities of a full-stack Single Page Application (SPA) framework. Its core philosophy revolves around declarative `data-*` attributes in HTML, allowing developers to add frontend reactivity with minimal JavaScript. The framework is designed to be lightweight, with its core functionality delivered via a single script tag.

### Overall Architecture: The `library/` Directory

The `library/` directory encapsulates the core logic and components of the Nexus UX framework. It's structured to separate concerns, with the central `engine/` managing the core reactivity and plugin orchestration, `plugins/` housing various functional extensions, and `utils/` providing common helper functions. The `vendored/` directory contains third-party libraries integrated into the project.

```
library/
├── src/
│   ├── bundles/             # Bundled versions of Nexus UX for distribution
│   ├── engine/              # The core reactivity engine and observer services
│   │   ├── consts.ts        # Constants and enums
│   │   ├── engine.ts        # The main engine logic
│   │   ├── errors.ts        # Custom error handling
│   │   ├── index.ts         # Entry point for the engine module
│   │   ├── intersectionObserverService.ts # Service for IntersectionObserver
│   │   ├── mutationObserverService.ts   # Service for MutationObserver
│   │   ├── performanceObserverService.ts # Service for PerformanceObserver
│   │   ├── resizeObserverService.ts     # Service for ResizeObserver
│   │   ├── signals.ts       # Signal management and reactivity
│   │   └── types.ts         # TypeScript type definitions
│   ├── globals.d.ts         # Global type declarations
│   ├── index.ts             # Main entry point for the library
│   ├── plugins/             # Contains various Nexus UX plugins
│   │   └── official/        # Official plugins categorized by functionality
│   │       ├── backend/
│   │       │   ├── actions/
│   │       │   ├── attributes/
│   │       │   ├── shared.ts
│   │       │   └── watchers/
│   │       ├── browser/
│   │       │   ├── actions/
│   │       │   └── attributes/
│   │       ├── core/
│   │       │   └── attributes/
│   │       ├── dom/
│   │       │   ├── attributes/
│   │       │   └── attributes/
│   │       └── logic/
│   │           └── actions/
│   ├── utils/               # General utility functions
│   │   ├── dom.ts           # DOM manipulation utilities
│   │   ├── paths.ts         # Path matching utilities
│   │   ├── tags.ts          # HTML tag related utilities
│   │   ├── text.ts          # Text manipulation utilities
│   │   ├── timing.ts        # Debounce/throttle utilities
│   │   └── view-transtions.ts # View Transition API utilities
│   └── vendored/            # Third-party libraries
│       ├── idiomorph.esm.d.ts # Type definitions for Idiomorph
│       ├── idiomorph.esm.js   # Idiomorph library for DOM morphing
│       └── preact-core.ts     # Preact Signals core implementation
├── .gitignore
├── README.md
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

### Core Engine (`engine/`)

The `engine/` directory is the heart of Nexus UX, responsible for managing reactivity, plugin lifecycle, and orchestrating interactions with browser APIs.

#### `engine/engine.ts`: The Central Orchestrator

This file contains the main logic for the Nexus UX engine. It initializes the core systems, manages plugins, handles DOM mutations, and dispatches events to specialized observer services.

**Key Components and Methods:**

*   **`signals: SignalsRoot`**: An instance of `SignalsRoot` from `signals.ts`, which manages all reactive data (signals) within the application.
*   **`actions: ActionPlugins`**: A map storing all registered action plugins, allowing them to be invoked by `data-on-*` attributes.
*   **`plugins: AttributePlugin[]`**: An array of registered attribute plugins, sorted by name length and alphabetically for deterministic application.
*   **`attributeOwnership: Map<Element, Map<string, AttributeUpdateCallback>>`**: This is a crucial part of the **attribute ownership model**. It maps an HTML element to another map, which in turn maps an attribute name (e.g., `data-text`, `data-bind`) to its corresponding `AttributeUpdateCallback`. This ensures that only the plugin "owning" a specific attribute on an element can update it, preventing conflicts and enabling efficient re-evaluation.
*   **`resizeOwnership: Map<Element, Map<string, ResizeUpdateCallback>>`**: Similar to `attributeOwnership`, but specifically for `ResizeObserver` callbacks.
*   **`intersectionOwnership: Map<Element, Map<string, IntersectionUpdateCallback>>`**: Similar to `attributeOwnership`, but specifically for `IntersectionObserver` callbacks.
*   **`performanceOwnership: Map<Element, Map<string, PerformanceUpdateCallback>>`**: Similar to `attributeOwnership`, but specifically for `PerformanceObserver` callbacks.
*   **`removals: Map<string, Map<number, OnRemovalFn>>`**: Stores cleanup functions associated with elements and their attributes. When an element or attribute is removed from the DOM, these functions are called to prevent memory leaks and ensure proper resource deallocation.
*   **`mutationObserverService: MutationObserverService | null`**: Instance of the `MutationObserverService` for centralized DOM mutation observation.
*   **`resizeObserverService: ResizeObserverService | null`**: Instance of the `ResizeObserverService` for centralized element resize observation.
*   **`intersectionObserverService: IntersectionObserverService | null`**: Instance of the `IntersectionObserverService` for centralized element intersection observation.
*   **`performanceObserverService: PerformanceObserverService | null`**: Instance of the `PerformanceObserverService` for centralized performance entry observation.
*   **`alias: string`**: A prefix used for Nexus UX attributes (e.g., `data-`).
*   **`setAlias(value: string)`**: Sets the global alias for Nexus UX attributes.
*   **`load(...pluginsToLoad: Nexus UXPlugin[])`**:
    *   Iterates through provided plugins.
    *   Initializes `InitContext` for each plugin, providing access to core engine functionalities (`signals`, `effect`, `actions`, `removals`, `applyToElement`).
    *   Categorizes plugins into `actions`, `plugins` (attribute plugins), or executes `onGlobalInit` for `Watcher` plugins.
    *   Sorts attribute plugins by name length (descending) then alphabetically to ensure more specific attributes (e.g., `data-class-bold`) are processed before general ones (`data-class`).
*   **`apply()`**:
    *   The entry point for applying Nexus UX to the DOM.
    *   Uses `queueMicrotask` to delay application, allowing custom plugins to load first.
    *   Calls `applyToElement(document.documentElement)` to process the entire document.
    *   Initializes and starts `mutationObserverService` if it's not already running, passing `handleMutation` as its callback.
*   **`applyToElement(rootElement: HTMLorSVGElement)`**:
    *   Traverses the DOM starting from `rootElement` using `walkDOM`.
    *   For each element, it identifies Nexus UX attributes (prefixed with `alias`).
    *   Compares attribute hashes to determine if an attribute has changed, triggering re-application only when necessary.
    *   Manages cleanup functions (`removals`) for attributes that are no longer present or have changed.
    *   Calls `applyAttributePlugin` for each relevant attribute.
*   **`handleMutation(...)`**:
    *   This function acts as the central dispatch for DOM mutation events reported by `MutationObserverService`.
    *   It differentiates between `elementRemoved`, `elementAdded`, and `attributes` changes.
    *   For `elementRemoved`, it triggers cleanup functions associated with the element and removes its entries from `attributeOwnership`, `resizeOwnership`, `intersectionOwnership`, and `performanceOwnership`. It also unobserves the element from `ResizeObserverService` and `IntersectionObserverService`.
    *   For `elementAdded`, it calls `applyToElement` to process the newly added element and its children.
    *   For `attributes` changes, it looks up the relevant `updateCallback` in `attributeOwnership` and executes it.
*   **`handleResize(...)`**:
    *   This function is the dispatch callback for `ResizeObserverService`.
    *   It retrieves the `resizeOwnership` map for the resized element.
    *   Iterates through registered `resizeCallback` functions for that element and executes them.
*   **`handleIntersection(...)`**:
    *   This function is the dispatch callback for `IntersectionObserverService`.
    *   It retrieves the `intersectionOwnership` map for the intersected element.
    *   Iterates through registered `intersectionCallback` functions for that element and executes them.
*   **`handlePerformance(...)`**:
    *   This function is the dispatch callback for `PerformanceObserverService`.
    *   It retrieves the `performanceOwnership` map for the element (currently `document.documentElement` as PerformanceObserver is global).
    *   Iterates through registered `performanceCallback` functions and executes them.
*   **`applyAttributePlugin(...)`**:
    *   Identifies the specific `AttributePlugin` responsible for a given `data-*` attribute.
    *   Extracts the attribute's key, value, and modifiers.
    *   Creates a `RuntimeContext` for the plugin's execution, providing access to signals, actions, and other engine utilities.
    *   Enforces plugin requirements (`keyReq`, `valReq`) for attribute keys and values.
    *   Calls the plugin's `onLoad` method, which returns cleanup and update callbacks.
    *   Stores the cleanup function in `removals`.
    *   Registers `updateCallback` in `attributeOwnership` for attribute changes.
    *   Registers `resizeCallback` in `resizeOwnership` if `plugin.observesResize` is true.
    *   Registers `intersectionCallback` in `intersectionOwnership` if `plugin.observesIntersection` is true.
    *   Registers `performanceCallback` in `performanceOwnership` if `plugin.observesPerformance` is true.
    *   Initializes and observes elements with `ResizeObserverService` and `IntersectionObserverService` if the plugin requires it.
    *   Initializes `PerformanceObserverService` if the plugin requires it (PerformanceObserver is global, so no element-specific observation).
*   **`genRX(...)`**:
    *   Generates a reactive expression function from a string.
    *   Parses the expression to identify and replace Nexus UX-specific syntax (e.g., `@action()`, `$signal`).
    *   Injects `ctx` and other arguments into the function's scope.
    *   Handles escaped values.
    *   Provides robust error handling for expression generation and execution.

#### `engine/types.ts`: The Blueprint

This file defines the core TypeScript types and interfaces used throughout the Nexus UX engine and plugin system. It's crucial for maintaining type safety and clarity.

**Key Type Definitions:**

*   **`OnRemovalFn`**: A function that performs cleanup when an element or plugin is removed.
*   **`AttributeUpdateCallback`**: A callback function invoked when an attribute's value changes.
*   **`ResizeUpdateCallback`**: A callback function invoked when an element's size changes.
*   **`IntersectionUpdateCallback`**: A callback function invoked when an element's intersection with the viewport changes.
*   **`PerformanceUpdateCallback`**: A callback function invoked when performance entries are observed.
*   **`PluginType`**: An enum (`Attribute`, `Watcher`, `Action`) categorizing different types of plugins.
*   **`Nexus UXPlugin`**: Base interface for all plugins, defining `type` and `name`.
*   **`Requirement`**: An enum (`Allowed`, `Must`, `Denied`, `Exclusive`) defining rules for attribute keys and values.
*   **`AttributePlugin`**: Extends `Nexus UXPlugin` for attributes. Key properties include:
    *   `onGlobalInit?`: Optional callback run once globally.
    *   `onLoad`: The main lifecycle method, returning cleanup and update callbacks.
    *   `keyReq?`, `valReq?`: Requirements for attribute keys/values.
    *   `argNames?`: Argument names for reactive expressions.
    *   `affectsDOM?`: **Crucial for asynchronous model.** Indicates if the plugin directly manipulates the DOM visually. This flag will be used by the engine to queue operations appropriately (e.g., `requestAnimationFrame` for DOM manipulation, microtasks for non-blocking operations).
    *   `observesResize?`, `observesIntersection?`, `observesPerformance?`: Flags indicating if the plugin needs to observe these specific browser events.
*   **`WatcherPlugin`**: For plugins that run globally (e.g., listening to SSE events).
*   **`ActionPlugin`**: For plugins that define callable actions (e.g., `data-on-click="@post('/endpoint')"`).
*   **`InitContext`**: Context provided during plugin initialization.
*   **`HTMLorSVGElement`**: A union type for HTML and SVG elements.
*   **`Modifiers`**: A map for parsing attribute modifiers (e.g., `data-on-click.prevent.once`).
*   **`RuntimeContext`**: Context provided during plugin execution, including access to signals, element, attribute details, and error handling.
*   **`SignalsRoot`**: Interface for the signal management system.

#### `engine/consts.ts`: Configuration and Constants

This file defines various constants, default values, and enums used throughout the Nexus UX engine and plugins.

**Key Constants:**

*   `DSP`, `DSS`: Internal delimiters for escaped values in reactive expressions.
*   `DATASTAR`, `DATASTAR_REQUEST`: Core framework identifiers.
*   `DefaultSseRetryDurationMs`: Default retry duration for Server-Sent Events.
*   `DefaultExecuteScriptAttributes`, `DefaultExecuteScriptAutoRemove`: Defaults for script execution.
*   `DefaultFragmentsUseViewTransitions`, `DefaultMergeSignalsOnlyIfMissing`: Defaults for fragment and signal merging.
*   `FragmentMergeModes`: Enum defining how HTML fragments are merged into the DOM (e.g., `Morph`, `Inner`, `Outer`).
*   `EventTypes`: Enum defining various Server-Sent Event types for inter-component communication (e.g., `MergeFragments`, `MergeSignals`).

#### `engine/errors.ts`: Robust Error Handling

This file provides a centralized and structured way to handle and report errors within the Nexus UX framework. It generates detailed error messages with context, including plugin name, element ID, and expression details, making debugging easier.

**Key Functions:**

*   `dserr`: A helper function to format Nexus UX-specific errors.
*   `internalErr`: For internal framework errors.
*   `initErr`: For errors during plugin initialization.
*   `runtimeErr`: For errors during plugin runtime execution (e.g., invalid expressions).

#### `engine/signals.ts`: Reactive State Management

This file implements the core reactivity system using a `SignalsRoot` class, which wraps the `preact-core` signals. It manages a tree-like structure of reactive signals, allowing components to react to data changes efficiently.

**Key Components and Methods:**

*   **`SignalsRoot` class**:
    *   `#signals: NestedSignal`: The private internal representation of the signal tree.
    *   `exists(dotDelimitedPath: string)`: Checks if a signal exists at a given path.
    *   `signal<T>(dotDelimitedPath: string)`: Retrieves a signal instance.
    *   `setSignal<T>(dotDelimitedPath: string, signal: T)`: Sets a signal instance at a given path.
    *   `setComputed<T>(dotDelimitedPath: string, fn: () => T)`: Creates and sets a computed signal.
    *   `value<T>(dotDelimitedPath: string)`: Retrieves the current value of a signal.
    *   `setValue<T>(dotDelimitedPath: string, value: T)`: Sets the value of a signal, triggering updates.
    *   `upsertIfMissing<T>(dotDelimitedPath: string, defaultValue: T)`: Inserts a signal if it doesn't exist, otherwise returns the existing one.
    *   `remove(...dotDelimitedPaths: string[])`: Removes signals from the tree.
    *   `merge(other: NestedValues, onlyIfMissing = false)`: Merges new values into the signal tree.
    *   `subset(...keys: string[])`: Returns a subset of signals.
    *   `walk(cb: (name: string, signal: Signal<any>) => void)`: Traverses the signal tree.
    *   `paths()`: Returns all signal paths.
    *   `values(onlyPublic = false)`: Returns all signal values as a plain object.
    *   `JSON(shouldIndent = true, onlyPublic = false)`: Returns signal values as JSON.
    *   `filtered(opts?: SignalFilterOptions, obj?: NestedValues)`: Returns a filtered subset of signals.
*   **`dispatchSignalEvent(evt: Partial<Nexus UXSignalEvent>)`**: Dispatches a custom DOM event (`datastar-signals`) whenever signals are added, removed, or updated, allowing external watchers to react.
*   **`nestedValues(signal: NestedSignal, onlyPublic = false)`**: Recursively converts a nested signal object into a plain object of values.
*   **`mergeNested(target: NestedValues, values: NestedValues, onlyIfMissing = false)`**: Recursively merges new values into an existing nested object, handling signal updates and additions.
*   **`walkNestedSignal(...)`**: Recursively walks a nested signal structure.
*   **`nestedSubset(...)`**: Creates a subset of a nested object based on provided keys.
*   **`walkNestedValues(...)`**: Recursively walks a nested value structure.

#### Observer Services: Centralized Browser API Management

These services encapsulate the logic for interacting with specific browser observer APIs, offloading this responsibility from the main `engine.ts` file. They report changes back to the engine via dispatch callbacks, allowing the engine to maintain its attribute ownership model and orchestrate plugin responses.

##### `engine/mutationObserverService.ts`

*   **Purpose**: Centralizes the management of `MutationObserver` to detect changes in the DOM tree (additions, removals, attribute modifications).
*   **`MutationDispatchCallback`**: A type defining the callback function that the engine provides to this service to receive mutation events.
*   **`MutationObserverService` class**:
    *   `observer: MutationObserver`: The native browser `MutationObserver` instance.
    *   `dispatchCallback: MutationDispatchCallback`: The engine's callback to report mutations.
    *   `constructor(dispatchCallback)`: Initializes the service with the engine's dispatch callback.
    *   `startObserving(root)`: Starts observing DOM changes from a root element (e.g., `document.body`).
    *   `stopObserving()`: Disconnects the observer.
    *   `handleMutations(mutations)`: Processes observed mutations. It dispatches `elementRemoved`, `elementAdded`, or attribute change events to the engine's `dispatchCallback`, along with relevant element and attribute details.

##### `engine/resizeObserverService.ts`

*   **Purpose**: Centralizes the management of `ResizeObserver` to detect changes in the size of observed elements.
*   **`ResizeDispatchCallback`**: A type defining the callback function that the engine provides to this service to receive resize events.
*   **`ResizeObserverService` class**:
    *   `observer: ResizeObserver`: The native browser `ResizeObserver` instance.
    *   `dispatchCallback: ResizeDispatchCallback`: The engine's callback to report resize events.
    *   `constructor(dispatchCallback)`: Initializes the service.
    *   `observe(element)`: Adds an element to be observed for resize changes.
    *   `unobserve(element)`: Stops observing a specific element.
    *   `disconnect()`: Disconnects the observer from all elements.
    *   `handleResizes(entries)`: Processes observed resize entries and dispatches them to the engine's `dispatchCallback`.

##### `engine/intersectionObserverService.ts`

*   **Purpose**: Centralizes the management of `IntersectionObserver` to detect when an element enters or exits the viewport, or crosses a specified intersection threshold.
*   **`IntersectionDispatchCallback`**: A type defining the callback function that the engine provides to this service to receive intersection events.
*   **`IntersectionObserverService` class**:
    *   `observer: IntersectionObserver`: The native browser `IntersectionObserver` instance.
    *   `dispatchCallback: IntersectionDispatchCallback`: The engine's callback to report intersection events.
    *   `constructor(dispatchCallback, options?)`: Initializes the service, optionally with `IntersectionObserverInit` options.
    *   `observe(element)`: Adds an element to be observed for intersection changes.
    *   `unobserve(element)`: Stops observing a specific element.
    *   `disconnect()`: Disconnects the observer from all elements.
    *   `handleIntersections(entries)`: Processes observed intersection entries and dispatches them to the engine's `dispatchCallback`.

##### `engine/performanceObserverService.ts`

*   **Purpose**: Centralizes the management of `PerformanceObserver` to collect performance metrics (e.g., marks, measures, resource timings).
*   **`PerformanceDispatchCallback`**: A type defining the callback function that the engine provides to this service to receive performance entries.
*   **`PerformanceObserverService` class**:
    *   `observer: PerformanceObserver`: The native browser `PerformanceObserver` instance.
    *   `dispatchCallback: PerformanceDispatchCallback`: The engine's callback to report performance entries.
    *   `constructor(dispatchCallback, entryTypes)`: Initializes the service with the engine's dispatch callback and an array of `entryTypes` to observe.
    *   `disconnect()`: Disconnects the observer.
    *   `handlePerformanceEntries(entries)`: Processes observed performance entries and dispatches them to the engine's `dispatchCallback`. Note that `PerformanceObserver` is global and does not observe specific elements.

**Orchestration Flow (Engine and Services):**

The engine acts as the central hub. Observer services detect changes in their respective domains (DOM mutations, element resizes, intersections, performance metrics) and report these changes back to the engine via dedicated dispatch callbacks (`handleMutation`, `handleResize`, `handleIntersection`, `handlePerformance`). The engine then uses its `attributeOwnership`, `resizeOwnership`, `intersectionOwnership`, and `performanceOwnership` maps to identify which specific plugins are "interested" in these changes and invokes their registered update callbacks. This centralized model ensures:

1.  **Single Instance Observers**: Only one instance of each observer type (Mutation, Resize, Intersection, Performance) is created, reducing resource overhead.
2.  **Decoupling**: Observer logic is separated from the core engine, making it more modular and testable.
3.  **Attribute Ownership**: The engine maintains control over which plugin is responsible for which attribute/element, preventing conflicts.
4.  **Efficient Dispatch**: Events are dispatched efficiently to only the relevant plugins.

```mermaid
graph TD
    subgraph Browser
        MutationObserver --> MOS[MutationObserverService]
        ResizeObserver --> ROS[ResizeObserverService]
        IntersectionObserver --> IOS[IntersectionObserverService]
        PerformanceObserver --> POS[PerformanceObserverService]
    end

    subgraph Nexus UX Engine (engine.ts)
        MOS -- Reports Mutations --> Engine[Engine]
        ROS -- Reports Resizes --> Engine
        IOS -- Reports Intersections --> Engine
        POS -- Reports Performance --> Engine

        Engine -- Invokes --> PluginUpdateCallbacks(Plugin Update Callbacks)
        Engine -- Manages --> AttributeOwnership(Attribute Ownership Maps)
        Engine -- Manages --> Removals(Cleanup Functions)
        Engine -- Orchestrates --> PluginLifecycle(Plugin Load/Unload)
    end

    subgraph Nexus UX Plugins
        PluginUpdateCallbacks -- Triggers --> PluginLogic(Plugin Logic)
    end

    style Engine fill:#f9f,stroke:#333,stroke-width:2px
    style MOS fill:#ccf,stroke:#333,stroke-width:1px
    style ROS fill:#ccf,stroke:#333,stroke-width:1px
    style IOS fill:#ccf,stroke:#333,stroke-width:1px
    style POS fill:#ccf,stroke:#333,stroke-width:1px
    style PluginUpdateCallbacks fill:#cfc,stroke:#333,stroke-width:1px
    style AttributeOwnership fill:#ffc,stroke:#333,stroke-width:1px
    style Removals fill:#ffc,stroke:#333,stroke-width:1px
    style PluginLifecycle fill:#ffc,stroke:#333,stroke-width:1px
    style PluginLogic fill:#fcf,stroke:#333,stroke-width:1px
```

### Plugin System (`plugins/`)

The `plugins/` directory contains various extensions that add specific functionalities to Nexus UX. Plugins are categorized by their domain (backend, browser, core, dom, logic) and type (actions, attributes, watchers).

#### `plugins/index.ts`

This file serves as an index for exporting all official plugins, making them easily importable for bundling or custom usage.

#### Plugin Types and Lifecycle (`engine/types.ts` revisited)

*   **`AttributePlugin`**: These are the most common plugins, associated with `data-*` attributes on HTML elements.
    *   `onLoad(ctx: RuntimeContext)`: This is the primary method where a plugin's logic is executed when its attribute is encountered on an element. It receives a `RuntimeContext` object providing access to the element, signals, actions, and other engine utilities. It can return:
        *   A `cleanup` function (`OnRemovalFn`): Executed when the element or attribute is removed from the DOM. Essential for detaching event listeners, clearing timers, or releasing resources.
        *   An `updateCallback` (`AttributeUpdateCallback`): Executed when the attribute's value changes. This allows the plugin to reactively update its behavior without a full re-initialization.
        *   `ResizeUpdateCallback?`, `IntersectionUpdateCallback?`, `PerformanceUpdateCallback?`: Optional callbacks for specific observer events, returned as part of the `onLoad` array.
*   **`ActionPlugin`**: These plugins define callable functions that can be invoked from `data-on-*` attributes (e.g., `data-on-click="@post('/endpoint')"`). They have an `fn` method that receives the `RuntimeContext` and any arguments passed in the expression.
*   **`WatcherPlugin`**: These plugins run globally and typically listen for custom events or perform background tasks. They have an `onGlobalInit` method that is called once during engine initialization.

#### Examples of Official Plugins:

*   **Backend Plugins (`plugins/official/backend/`)**:
    *   **Actions (`actions/`)**: `delete.ts`, `fetch.ts`, `get.ts`, `patch.ts`, `post.ts`, `put.ts`, `sse.ts`. These provide HTTP request capabilities, often integrated with Server-Sent Events (SSE) for real-time updates. `fetch.ts` is a core utility for creating HTTP methods.
    *   **Attributes (`attributes/`)**: `indicator.ts`. Manages loading indicators based on fetch events.
    *   **Watchers (`watchers/`)**: `executeScript.ts`, `mergeFragments.ts`, `mergeSignals.ts`, `removeFragments.ts`, `removeSignals.ts`. These listen for specific SSE events from the backend to perform DOM manipulations (morphing, adding, removing elements) or signal updates.
    *   **`shared.ts`**: Defines common types and functions for backend-related plugins, like `DATASTAR_FETCH_EVENT` and `datastarSSEEventWatcher`.

*   **Browser Plugins (`plugins/official/browser/`)**:
    *   **Actions (`actions/`)**: `clipboard.ts`. Provides clipboard interaction.
    *   **Attributes (`attributes/`)**: `component.ts`, `customValidity.ts`, `onIntersect.ts`, `onInterval.ts`, `onLoad.ts`, `onRaf.ts`, `onSignalChange.ts`, `persist.ts`, `replaceUrl.ts`, `scrollIntoView.ts`, `viewTransition.ts`. These plugins interact with various browser APIs and events:
        *   `component.ts`: A powerful plugin for creating reusable web components with isolated scope, reactive props, and lifecycle hooks. It leverages Shadow DOM and Light DOM.
        *   `onIntersect.ts`: Uses `IntersectionObserver` to trigger actions when an element intersects the viewport.
        *   `onInterval.ts`: Triggers actions at regular intervals using `setInterval`.
        *   `onLoad.ts`: Triggers actions after an element loads or after a delay.
        *   `onRaf.ts`: Triggers actions on each `requestAnimationFrame` cycle.
        *   `onSignalChange.ts`: Triggers actions when specific signals change.
        *   `persist.ts`: Persists signal values to `localStorage` or `sessionStorage`.
        *   `replaceUrl.ts`: Modifies the browser's URL without a full page reload.
        *   `scrollIntoView.ts`: Scrolls an element into view.
        *   `viewTransition.ts`: Integrates with the View Transitions API for smooth DOM changes.

*   **Core Plugins (`plugins/official/core/`)**:
    *   **Attributes (`attributes/`)**: `computed.ts`, `signals.ts`, `star.ts`.
        *   `computed.ts`: Creates computed signals based on expressions.
        *   `signals.ts`: Directly manages signals, allowing setting and merging of signal values from HTML attributes.
        *   `star.ts`: A humorous example plugin.

*   **DOM Plugins (`plugins/official/dom/`)**:
    *   **Attributes (`attributes/`)**: `attr.ts`, `bind.ts`, `class.ts`, `on.ts`, `ref.ts`, `show.ts`, `style.ts`, `text.ts`. These plugins directly manipulate the DOM:
        *   `attr.ts`: Sets or removes HTML attributes.
        *   `bind.ts`: Implements two-way data binding between form elements and signals.
        *   `class.ts`: Dynamically adds or removes CSS classes.
        *   `on.ts`: Attaches event listeners to elements, supporting modifiers like `prevent`, `stop`, `once`, `debounce`, `throttle`, and `viewtransition`.
        *   `ref.ts`: Exposes an element as a signal.
        *   `show.ts`: Toggles element visibility by setting `display: none`.
        *   `style.ts`: Dynamically applies CSS styles.
        *   `text.ts`: Sets the `textContent` of an element.

*   **Logic Plugins (`plugins/official/logic/`)**:
    *   **Actions (`actions/`)**: `fit.ts`, `setAll.ts`, `toggleAll.ts`. These provide utility functions for common logical operations on signals.
        *   `fit.ts`: Clamps and scales values within a range.
        *   `setAll.ts`: Sets the value of multiple signals matching a pattern.
        *   `toggleAll.ts`: Toggles the boolean value of multiple signals matching a pattern.

### Utility Functions (`utils/`)

The `utils/` directory contains various helper functions used across the Nexus UX engine and plugins.

*   **`utils/dom.ts`**:
    *   `Hash` class: A utility for generating deterministic hashes from strings or numbers, used for unique IDs and attribute change detection.
    *   `elUniqId(el: Element)`: Generates a unique ID for an element based on its hierarchy and attributes.
    *   `attrHash(key, val)`: Generates a hash for an attribute's key and value.
    *   `walkDOM(element, callback)`: Recursively traverses the DOM, applying a callback function to each element, respecting `data-star-ignore` attributes.

*   **`utils/paths.ts`**:
    *   `pathMatchesPattern(path, pattern)`: Checks if a signal path matches a given glob-like pattern (supporting `*` and `**`).
    *   `getMatchingSignalPaths(signals, paths)`: Retrieves all signal paths that match one or more provided patterns.

*   **`utils/tags.ts`**:
    *   `tagToMs(args: Set<string>)`: Converts time-related tag arguments (e.g., `100ms`, `2s`) into milliseconds.
    *   `tagHas(tags: Set<string>, tag: string, defaultValue = false)`: Checks if a set of tags contains a specific tag.

*   **`utils/text.ts`**:
    *   `isBoolString(str)`: Checks if a string represents a boolean (`'true'`).
    *   `kebab(str)`, `camel(str)`, `snake(str)`, `pascal(str)`: Functions for converting string casing.
    *   `jsStrToObject(raw)`: Converts a JavaScript object string into an object.
    *   `trimDollarSignPrefix(str)`: Removes a leading `$` from a string.
    *   `modifyCasing(str, mods)`: Applies casing modifications based on attribute modifiers.

*   **`utils/timing.ts`**:
    *   `debounce(callback, wait, leading, trailing)`: Creates a debounced version of a function.
    *   `throttle(callback, wait, leading, trailing)`: Creates a throttled version of a function.
    *   `modifyTiming(callback, mods)`: Applies debounce or throttle modifiers to a callback based on attribute modifiers.

*   **`utils/view-transtions.ts`**:
    *   `DocumentSupportingViewTransitionAPI`, `IViewTransition`: Interfaces for the View Transitions API.
    *   `docWithViewTransitionAPI`: Casts `document` to the View Transition API supporting type.
    *   `supportsViewTransitions`: Checks if the browser supports the View Transitions API.
    *   `modifyViewTransition(callback, mods)`: Wraps a callback with `document.startViewTransition` if the `viewtransition` modifier is present.

### Vendored Libraries (`vendored/`)

These are third-party libraries that Nexus UX integrates directly into its codebase.

*   **`vendored/preact-core.ts`**:
    *   This file contains the core implementation of Preact Signals, a highly optimized reactive state management library.
    *   It defines `Signal` (for reactive values), `Computed` (for derived reactive values), and `Effect` (for side effects that react to signal changes).
    *   It includes mechanisms for dependency tracking, batching updates, and efficient re-computation, forming the backbone of Nexus UX's reactivity.
    *   The `Signal` class has `_onChange` which is used by `SignalsRoot` to dispatch `Nexus UXSignalEvent` when a signal's value changes.

*   **`vendored/idiomorph.esm.d.ts` / `idiomorph.esm.js`**:
    *   Idiomorph is a library for efficiently morphing (diffing and patching) DOM trees.
    *   Nexus UX uses Idiomorph (specifically `Idiomorph.morph`) in plugins like `MergeFragments` to update the DOM with new HTML content while preserving existing element states (like focus, input values) and minimizing re-renders. This is crucial for a smooth user experience in a hypermedia framework.

### Conclusion

The Nexus UX core library is a well-structured and modular framework designed for building reactive web applications with a focus on declarative HTML. The `engine` acts as a central orchestrator, managing plugins, reactive state (`signals`), and delegating specialized tasks to dedicated observer services (Mutation, Resize, Intersection, Performance). This architecture, combined with a robust plugin system and utility functions, allows Nexus UX to provide powerful frontend reactivity while maintaining a lean footprint and efficient DOM manipulation through libraries like Idiomorph. The attribute ownership model and the asynchronous execution strategy (via `affectsDOM` flag and microtasks/requestAnimationFrame) are key to its performance and maintainability.

This extensive technical report provides a comprehensive overview of the Nexus UX core library, detailing its architecture, key components, and the intricate relationships between its various parts.
