# Router Implementation Alignment Report

## Introduction
This report compares the implemented Nexus UX Router solution (based on `router.ts`, `route.ts`, and `history.ts` from `@library/src/plugins/official/browser/`) against the `router-spec.md` design document. The goal is to identify alignments, divergences, and propose strategies for handling these differences.

## Comparison by Component/Concept

### 1. `router.ts` (Implemented) vs. `Router` Core Module (Design)

#### 1.1. Signal Initialization (`$router` state)
*   **Spec:** The design details the initialization of `$router.path`, `$router.params`, `$router.query`, `$router.hash`, `$router.loading`, `$router.error`, `$router.previousPath`, `$router.current.layout`, `$router.current.route`, `$router.routes`, `$router.current.meta`, and `$router.scrollPosition`.
*   **Implementation:** The `onGlobalInit` method in `router.ts` initializes `$router.path`, `$router.params`, `$router.query`, `$router.hash`, `$router.loading`, `$router.error`, `$router.previousPath`, `$router.currentLayoutComponentUrl`, `$router.currentPageComponentUrl`, `$router.routes`, and `$router.config` (with a default mode of 'hybrid').
*   **Alignment/Divergence:**
    *   **Alignment:** Most core `$router` signals are correctly initialized.
    *   **Divergence:**
        *   The implemented signal names `$router.currentLayoutComponentUrl` and `$router.currentPageComponentUrl` do not match the new spec names `$router.current.layout` and `$router.current.route`.
        *   `$router.current.meta` and `$router.scrollPosition` are *not* explicitly initialized in the `router.ts` implementation, despite being listed in the design spec's "Key Internal State".
        *   `$router.config` is initialized in the implementation to manage the routing mode, which is implicitly part of the spec's `data-signals-router.mode` concept but not explicitly listed as a signal in the "Key Internal State" section. This is a minor documentation divergence.

#### 1.2. Navigation (`navigate` function)
*   **Spec:** The design describes the `navigate(url, options?)` function, including saving the current scroll position to `history.state`, updating `$router.previousPath`, and calling `pushState`/`replaceState`.
*   **Implementation:** The `navigate` function is present and correctly updates `$router.previousPath` and uses `pushState`/`replaceState`.
*   **Alignment/Divergence:**
    *   **Alignment:** The core navigation logic and history manipulation are aligned.
    *   **Divergence:** The implementation includes a `TODO: Save scroll position to history.state` comment, indicating that this designed feature is not yet fully implemented. The spec explicitly states the router *will* automatically restore scroll position, implying it must also save it.

#### 1.3. Route Matching and Resolution (`resolveAndLoadRoute`)
*   **Spec:** The design covers route discovery based on mode (`signal`, `static`, `hybrid`) with precedence rules, error handling (updating `$router.error` and navigating to `/404.html`), and loading indicators (`$router.loading`). It also mentions the execution of `data-route:handler` and various route transition hooks.
*   **Implementation:** The `resolveAndLoadRoute` function correctly implements the logic for `signal`, `static`, and `hybrid` modes, prioritizing explicit routes over file-system routes in hybrid mode. The `routeMatcher` function handles dynamic segments and wildcards. Error handling for 404s and loading indicators are also correctly implemented. The `data-route:handler` is executed.
*   **Alignment/Divergence:**
    *   **Alignment:** Strong alignment in route resolution logic, mode handling, basic error handling, and loading indicators. The `routeMatcher` function aligns well with the specified route pattern support.
    *   **Divergence:** While `data-route:handler` is executed, the other specific route transition hooks (`data-route:before-enter`, `data-route:after-enter`, `data-route:before-leave`, `data-route:after-leave`) mentioned in the `route.ts` design and the "Key Interactions and Flow" section of the spec are *not* explicitly triggered within the `router.ts` implementation. This is a significant gap in the full navigation lifecycle implementation.

#### 1.4. Event Listeners
*   **Spec:** The design specifies interception of `popstate` and `click` events.
*   **Implementation:** Both `popstate` (via a custom `ROUTER_POPSTATE_EVENT` dispatched by `history.ts`) and `click` event listeners are implemented in `router.ts`. The click listener correctly checks for internal links, the `data-native` attribute, and `_blank` targets.
*   **Alignment/Divergence:** Strong alignment.

### 2. `route.ts` (Implemented) vs. `Route` Attribute Plugin (Design)

#### 2.1. `onLoad` Method and Route Definition
*   **Spec:** The design details the extraction of `path`, `handler`, `meta`, `redirect`, and `component` attributes from the `<template data-route>` element, and their registration to the `$router.routes` signal. It also mentions cleanup logic.
*   **Implementation:** The `onLoad` method correctly extracts the `path` (from `ctx.key`), `data-route:handler`, `data-route:meta`, `data-route:redirect`, and `data-component` attributes. It constructs a `RouteDefinition` and adds it to the `$router.routes` signal. A cleanup function is also provided to remove the route from the signal array.
*   **Alignment/Divergence:**
    *   **Alignment:** Very strong alignment in attribute extraction, route definition, and registration. The cleanup mechanism is also correctly implemented.
    *   **Divergence:** The `router-spec.md`'s `data-route` syntax example includes `data-route:layout`, but the `route.ts` implementation does not extract or process this attribute. This is a minor divergence in attribute handling.

#### 2.2. Route Handler Execution and Transition Hooks
*   **Spec:** The design describes the execution of `data-route:handler` and the various transition hooks (`before-enter`, `after-enter`, `before-leave`, `after-leave`) at specific points in the navigation lifecycle.
*   **Implementation:** `route.ts` defines the structure for these attributes, but their *execution* is delegated to `router.ts`. As noted in 1.3, only the `data-route:handler` is explicitly executed in `router.ts`.
*   **Alignment/Divergence:** Divergence in the *execution* of the full suite of transition hooks. `route.ts` correctly defines the attributes, but `router.ts` does not yet fully implement their lifecycle execution as described in the spec.

### 3. `history.ts` (Implemented) vs. History Management Utility (Design)

#### 3.1. `pushState` and `replaceState`
*   **Spec:** The design defines wrapper functions for `window.history.pushState` and `window.history.replaceState`.
*   **Implementation:** Both `pushState` and `replaceState` functions are correctly implemented as wrappers around the native browser History API methods.
*   **Alignment/Divergence:** Strong alignment.

#### 3.2. `popstate` Event Handling
*   **Spec:** The design describes listening for the browser's `popstate` event and dispatching a custom event (`router:popstate`) for internal consumption.
*   **Implementation:** The `History` watcher plugin correctly implements an event listener for `window.popstate` and dispatches a `CustomEvent<RouterPopstateEvent>` with the `ROUTER_POPSTATE_EVENT` type.
*   **Alignment/Divergence:** Strong alignment.

## Overall Alignment and Divergences

The implemented routing solution demonstrates a strong foundational alignment with the `router-spec.md` design, particularly in its core architecture, signal management, and basic navigation flows. The `routeMatcher` and the handling of different router modes (`signal`, `static`, `hybrid`) are well-implemented according to the specification.

However, several key divergences exist, primarily related to the completeness of the navigation lifecycle and state management:

1.  **Signal Naming Convention:** The implemented signal names `$router.currentLayoutComponentUrl` and `$router.currentPageComponentUrl` do not match the new spec names `$router.current.layout` and `$router.current.route`.
2.  **Missing Scroll Position Saving:** The implementation lacks the explicit saving of scroll position to `history.state` before navigation, which is a designed UX feature.
3.  **Incomplete Route Transition Hooks:** The full suite of `data-route` transition hooks (`before-enter`, `after-enter`, `before-leave`, `after-leave`) are defined in the spec and `route.ts`, but their execution logic is not yet present in `router.ts`. Only `data-route:handler` is currently executed.
4.  **Uninitialized `$router.current.meta` and `$router.scrollPosition` signals:** These signals are part of the designed router state but are not explicitly initialized in the `router.ts` `onGlobalInit` method.
5.  **`data-route:layout` attribute not processed:** The `route.ts` implementation does not extract or utilize the `data-route:layout` attribute, which is part of the `data-route` syntax in the spec and relevant for dynamic layouts.

## Proposed Handling of Divergences

To bring the implemented solution into full alignment with the `router-spec.md` and enhance its capabilities, the following actions are proposed:

1.  **Update Signal Naming Convention:**
    *   **Action:** Refactor `router.ts` and any other relevant files to use `$router.current.layout` and `$router.current.route` instead of `$router.currentLayoutComponentUrl` and `$router.currentPageComponentUrl`.
    *   **Rationale:** Ensures consistency with the updated spec and improves clarity of the router's state.

2.  **Implement Scroll Position Saving:**
    *   **Action:** Add logic within the `navigate` function in `router.ts` to save `window.scrollY` (and optionally `window.scrollX`) to `history.state` before calling `pushState` or `replaceState`.
    *   **Rationale:** Essential for a smooth user experience, especially when navigating back and forth.

3.  **Complete Route Transition Hooks Execution:**
    *   **Action:** Integrate the execution of `data-route:before-enter`, `data-route:after-enter`, `data-route:before-leave`, and `data-route:after-leave` handlers into the `router.ts` navigation flow. This will require careful placement to ensure correct timing relative to route resolution, content loading, and deactivation.
    *   **Rationale:** These hooks are critical for implementing robust features like authentication guards, data pre-fetching, analytics, and resource cleanup, significantly enhancing the router's power and flexibility. This is a high-priority item.

4.  **Initialize and Utilize Missing `$router` Signals:**
    *   **Action:**
        *   Initialize `$router.current.meta` to an empty object (`{}`) in `router.ts` `onGlobalInit`. Update this signal within `resolveAndLoadRoute` when a route with `data-route:meta` is matched, ensuring the meta object is correctly merged or replaced.
        *   Initialize `$router.scrollPosition` to `{ x: 0, y: 0 }` in `router.ts` `onGlobalInit`. This signal will then be used in conjunction with the scroll position saving/restoration logic (Proposed Action 2).
    *   **Rationale:** Ensures the router's public API provides the full state as designed, enabling developers to build more informed and responsive UIs.

5.  **Process `data-route:layout` attribute:**
    *   **Action:**
        *   Modify `route.ts` to extract the `data-route:layout` attribute if it is present on the `<template data-route>` element.
        *   Modify `router.ts` `resolveAndLoadRoute` to use this extracted `layout` property from the `routeDefinition` to set the `$router.current.layout` signal when a signal-defined route is matched.
    *   **Rationale:** This attribute is crucial for enabling dynamic layout switching based on route definitions, a key feature for Content Fragment Routing and overall application flexibility.
