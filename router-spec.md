### Detailed Design Plan: Nexus UX Multiparadigm Router -- Revision 2025.07.29-04.58

The Nexus UX Multiparadigm Router will be a client-side JavaScript module, deeply integrated with the Nexus UX framework. Its primary role is to orchestrate content delivery and manage navigation across various paradigms (CSR, SSR, Hybrid) while adhering to Nexus UX's declarative, component-based, and minimal-JavaScript principles. Crucially, it is designed to facilitate the seamless loading and activation of **Nexus Islands**, self-contained interactive units that embody Nexus UX's multiparadigm reactivity, with the **static site's file structure serving as the direct definition of routes.**

#### I. Overall Architecture

The router's architecture will be centered around the following principles:

1.  **Client-Side Core:** The router will be a pure client-side JavaScript solution, completely decoupled from any specific backend technology. Its logic will run entirely in the browser.
2.  **Nexus UX Integration:** It will be implemented as a Nexus UX plugin, leveraging Nexus UX's core engine, signal system, and existing attribute plugins for reactivity, DOM manipulation, and event handling.
3.  **Static Site as Route Definition:** The physical file structure of the static HTML assets will *be* the primary definition of the application's routes. There will be no separate, explicit route configuration file.
4.  **Custom Element as the Central Hub:** Any custom element in the DOM will serve as the single point where routed content (a Nexus Island) is injected. The router will dynamically set this custom element's `data-component` attribute via a Nexus UX signal.
5.  **`component.ts` as the Content Renderer:** The `component.ts` plugin will be the exclusive mechanism for fetching, parsing, and injecting HTML content (the Nexus Island) into the designated custom element, as well as managing the lifecycle and reactivity of the loaded `NexusUXComponent` instances.

#### II. Core Components of the Router

The router will consist of the following key components, now correctly placed within the plugin structure:

1.  **`Router` Core Module (`src/plugins/official/core/watchers/router.ts`)**
    *   **Purpose:** The central singleton object managing all routing logic, history, and state. This file will also contain the logic for route matching and handler execution.
    *   **Type:** Watcher Plugin (as it initializes global router services).
    *   **Responsibilities:**
        *   **File-System Based Route Registry:** The router will implicitly derive its route registry from the static site's file structure. It will map URL paths directly to the corresponding static HTML files.
        *   **History Management:** Interact with the browser's History API (`pushState`, `replaceState`, `popstate`) to manage the URL and navigation stack.
        *   **Route Resolution:** Match the current URL path (whether from direct address bar entry or link clicks) against the derived route patterns, extract parameters, and identify the target static HTML file (the Nexus Island's source).
        *   **Navigation Orchestration:** Coordinate the entire navigation process, including executing route guards, updating router state signals, and triggering content loading via `component.ts`.
        *   **Public API:** Expose methods for programmatic navigation (e.g., `navigate()`) and provide access to router state via Nexus UX signals.
    *   **Key Internal State (Nexus UX Signals):**
        *   `$router.path`: Current resolved URL path (e.g., `/users/123`).
        *   `$router.params`: Object containing extracted route parameters (e.g., `{ id: '123' }`).
        *   `$router.query`: Object containing URL query parameters.
        *   `$router.hash`: Current URL hash fragment.
        *   `$router.loading`: Boolean indicating if a navigation is in progress.
        *   `$router.error`: Object/string for storing navigation errors (e.g., 404, guard failure).
        *   `$router.previousPath`: The path before the current navigation.
        *   `$router.currentRouteComponentUrl`: A signal that will hold the URL of the Nexus Island to be loaded into the designated custom element.
    *   **Dependencies:** `SignalsRoot` (from Nexus UX core), `History API` (via `history.ts`), `component.ts` (indirectly via `data-component` attribute).

2.  **Route Definition Mechanism (`src/plugins/official/core/attributes/route.ts`)**
    *   **Purpose:** Leverage the static site's file structure as the primary route definition, augmented by a `data-route` attribute for advanced configurations.
    *   **Type:** Attribute Plugin.
    *   **`data-route` Attribute Plugin:**
        *   **Syntax:** `<template data-route data-route:handler="myHandler"></template>` (The `data-component` attribute is often implicit from the file path, but can be overridden).
        *   **Functionality:**
            *   While the file path defines the route, this attribute allows associating handlers or other metadata directly within the HTML file itself.
            *   Parses the path pattern (supporting dynamic segments like `:param`, `:param?`, `*`) if explicitly provided, or infers it from the file path.
            *   Associates optional `data-route:handler` (JavaScript function name or expression) with the route.
            *   **Leverages:** Nexus UX's plugin system (`AttributePlugin`), `Router` core's `addRoute` method.

3.  **History Management Utility (`src/plugins/official/core/watchers/history.ts`)**
    *   **Purpose:** Provide a reusable module for interacting with the browser's History API.
    *   **Contents:** Functions for `pushState`, `replaceState`, and listening to `popstate` events.
    *   **Note:** While primarily used by the router, its separation allows for potential future use by other core Nexus UX functionalities if needed.

#### III. Key Interactions and Flow

1.  **Router Initialization (on page load):**
    *   The Nexus UX engine loads and initializes all plugins, including the `Router` Watcher Plugin.
    *   The `Router` Watcher Plugin's `onGlobalInit` method:
        *   **Static Site Route Discovery:** It will implicitly discover routes by understanding the static site's file structure. For example, a build step could generate a lightweight manifest of all HTML files and their corresponding URL paths (e.g., `site/index.html` -> `/`, `site/users/[id].html` -> `/users/:id`). This manifest will be used to populate the internal route registry.
        *   Identifies the custom element in the DOM that will serve as the router outlet (e.g., `<main-app-view data-component="$router.currentRouteComponentUrl"></main-app-view>`).
        *   Performs an initial route resolution based on `window.location.pathname` (or `hash` if configured). This includes **watching and intercepting direct address bar URL entries** for static files.
        *   Updates `$router.path`, `$router.params`, etc., signals.
        *   **Sets the `$router.currentRouteComponentUrl` signal** to the URL of the resolved route's content (e.g., `signals.setValue('$router.currentRouteComponentUrl', '/index.html')`).
        *   The custom element (e.g., `<main-app-view>`) with `data-component="$router.currentRouteComponentUrl"` will then be observed by `component.ts`. `component.ts` will fetch `/index.html`, parse its `<template>`, inject the content into the custom element, and activate Nexus UX on it. This injected content *is* the initial **Nexus Island**, immediately becoming reactive due to Nexus UX's core capabilities.

2.  **Client-Side Navigation (Link Clicks):**
    *   A global event listener (implemented using Nexus UX's `data-on-click` or an internal equivalent) intercepts clicks on `<a>` tags.
    *   If the link is internal and not explicitly marked `data-native` (or similar), `event.preventDefault()` is called.
    *   The Router core's `navigate()` method is called with the link's `href`.
    *   **`navigate()` Flow:**
        *   Sets `$router.loading = true`.
        *   Executes any `data-route:handler` functions for the new route.
            *   If a handler cancels (`false`) or redirects (`string`), the navigation stops or restarts.
            *   If handlers are `async` (e.g., fetching data), the router waits for completion.
        *   Updates browser history using `history.pushState()` (or `replaceState()` for redirects).
        *   Updates `$router.path`, `$router.params`, etc., signals.
        *   **Sets the `$router.currentRouteComponentUrl` signal** to the URL of the new route's content (the next static HTML file, which will become a Nexus Island).
        *   `component.ts` takes over: fetches, parses, injects, and activates Nexus UX on the new content. This newly injected content becomes the active **Nexus Island**, immediately becoming interactive through its declarative attributes.
        *   Sets `$router.loading = false`.

3.  **Programmatic Navigation:**
    *   Developers call `window.$router.navigate('/new-path')` (or similar API exposed by the router).
    *   This directly invokes the `navigate()` flow described above, leading to the loading and activation of the target Nexus Island.

4.  **Browser Back/Forward Buttons:**
    *   The browser dispatches a `popstate` event.
    *   The Router core listens for `popstate`.
    *   It resolves the route based on the new `window.location`.
    *   It then triggers the content loading process by **setting the `$router.currentRouteComponentUrl` signal**, similar to a programmatic navigation, but without pushing a new history entry. This also results in the loading and activation of the appropriate Nexus Island.

#### IV. Leveraging Nexus UX Plugins (Detailed Integration)

This section details how existing Nexus UX plugins will be directly utilized or adapted for the router:

1.  **`Signals` (`data-signals-*`) & `Computed` (`data-computed-*`)**:
    *   **Router State:** The core router module will manage its state (`$router.path`, `$router.params`, `$router.loading`, `$router.error`, `$router.currentRouteComponentUrl`, etc.) as Nexus UX signals. These will be accessible globally (e.g., `signals.signal('$router.path').value`).
    *   **Reactive UI:** Any element can react to router state changes:
        ```html
        <div data-show="$router.loading">Loading route...</div>
        <h1 data-text="$router.path"></h1>
        <p data-text="$router.params.id"></p>
        <a href="/users/123" data-class-active="$router.path === '/users/123'">User Profile</a>
        ```
    *   **Computed Route Status:**
        ```html
        <div data-computed-isActiveUserPage="$router.path.startsWith('/users/')"></div>
        ```

2.  **`Component` (`data-component`)**:
    *   **Central Role:** This plugin is the *sole* mechanism for loading content (Nexus Islands) into the designated custom element. The router's job is to update the `$router.currentRouteComponentUrl` signal, which the custom element's `data-component` attribute is bound to.
    *   **Reactive Properties to Components:** Route parameters (`$router.params`) will be automatically passed as reactive properties to the loaded `NexusUXComponent` instances. For example, if the route is `/users/:id`, the `UserComponent` loaded into the custom element will receive `$props.id` as a signal.
        ```html
        <!-- In index.html, assuming 'my-router-view' is a custom element -->
        <my-router-view data-component="$router.currentRouteComponentUrl"></my-router-view>

        <!-- When router navigates, $router.currentRouteComponentUrl is set to, e.g., "/views/user-profile.html" -->

        <!-- In /views/user-profile.html (loaded by component.ts) -->
        <template>
          <user-profile-component>
            <h2 data-text="$props.id"></h2>
            <!-- $props.id is reactive, reflecting $router.params.id -->
          </user-profile-component>
        </template>
        ```
    *   **Component Lifecycle:** The `connectedCallback` and `disconnectedCallback` of `NexusUXComponent` will be used for component-specific setup and cleanup, ensuring proper resource management during route changes.

3.  **`On` (`data-on-*`)**:
    *   **Link Interception:** A global `data-on-click` listener (or a dedicated internal event listener) will be registered on `document.body`. This listener will:
        *   Identify `<a>` tags.
        *   Check if `href` is internal and not explicitly excluded (e.g., `data-native`).
        *   Call `event.preventDefault()`.
        *   Invoke `Router.navigate(link.href)`.
    *   **Programmatic Navigation Triggers:**
        ```html
        <button data-on-click="@router.navigate('/dashboard')">Go to Dashboard</button>
        <form data-on-submit="event => @router.navigate('/search?q=' + event.target.elements.query.value)">
          <input name="query" type="text">
          <button type="submit">Search</button>
        </form>
        ```

4.  **`ReplaceUrl` (`data-replace-url`)**:
    *   **Internal Use:** The Router core will use `window.history.replaceState` (which `ReplaceUrl` wraps) for specific scenarios:
        *   Initial page load (to clean up the URL if needed without adding to history).
        *   Redirects (to replace the current history entry with the new path).
    *   **Declarative Redirects (Advanced):** Potentially, a `data-route:redirect="/new-path"` attribute could internally trigger `ReplaceUrl`.

5.  **`Indicator` (`data-indicator-*`)**:
    *   **Loading State:** The router will bind its `$router.loading` signal to the `data-indicator` plugin.
    *   **Visual Feedback:**
        ```html
        <div id="loading-spinner" data-show="$router.loading">
          <img src="/spinner.gif" alt="Loading...">
        </div>
        ```

6.  **`MergeFragments` (Watcher) & `ViewTransition` (`data-view-transition`)**:
    *   **Smooth Transitions:** When `component.ts` injects new content into the custom element, it can be configured to leverage the View Transition API. The `MergeFragments` watcher's underlying use of Idiomorph and its `useViewTransition` option provides a blueprint for this. The router will ensure that the `data-component` update (triggered by the signal change) initiates a view transition for the entire custom element's content change.
    *   **Element-level Transitions:** Components loaded by the router can use `data-view-transition="unique-name"` on their internal elements to create fine-grained transitions during route changes.

7.  **`MergeSignals` & `RemoveSignals` (Watchers)**:
    *   **Route Guard Data:** Route handlers (guards) can fetch data and then use `signals.merge()` to make that data available as global signals before the component (Nexus Island) renders.
    *   **Cleanup:** When navigating away from a route, the router can trigger `signals.remove()` for signals specifically associated with the previous route, preventing memory leaks and stale data. This could be part of a `data-route:cleanup` handler.

8.  **`ScrollIntoView` (`data-scroll-into-view`)**:
    *   **Anchor Scrolling:** If a URL contains a hash (e.g., `/page#section`), after the new content is loaded by `component.ts`, the router will identify the element with the matching ID and programmatically apply `data-scroll-into-view` to it.
    *   **Focus Management:** The router can apply `data-scroll-into-view.focus` to the main content area of the custom element after a successful navigation for accessibility.

9.  **`Class` (`data-class-*`) & `Text` (`data-text`)**:
    *   **Navigation Styling:**
        ```html
        <nav>
          <a href="/" data-class-active="$router.path === '/'">Home</a>
          <a href="/about" data-class-active="$router.path === '/about'">About</a>
        </nav>
        ```
    *   **Displaying Route Information:**
        ```html
        <p>Current Path: <span data-text="$router.path"></span></p>
        ```

10. **`OnLoad` (`data-on-load`)**:
    *   **Post-Render Initialization:** Components (Nexus Islands) loaded by the router can use `data-on-load` for any JavaScript initialization that needs to happen *after* the component's HTML is in the DOM and Nexus UX has processed its attributes.
        ```html
        <!-- In a routed component's template -->
        <div data-on-load="initMap()">
          <!-- Map container -->
        </div>
        ```

#### V. Mandatory Features Implementation

1.  **Route Guards:**
    *   **Definition:** Handlers will be defined as JavaScript functions (either globally accessible or within a Nexus UX component's script) and referenced by the `data-route:handler` attribute on the `<template data-route>`.
    *   **Execution:** The `Router` core will execute these handlers sequentially before updating the DOM.
    *   **Asynchronous Support:** Handlers can be `async` functions, allowing for data fetching or API calls. The router will await their completion.
    *   **Cancellation/Redirection:** Handlers can return `false` to abort navigation or a new path string to redirect.
    *   **`AbortController`:** Each navigation will have an `AbortController` passed to handlers, allowing long-running operations (like fetches) to be cancelled if the user navigates away.

2.  **Error Handling (404):**
    *   A special route, e.g., a static file like `site/404.html`, will be the default fallback.
    *   If the `Router` core cannot match the current URL to any defined route (i.e., no corresponding static HTML file is found), it will automatically trigger a navigation to the `404.html` path.
    *   The `404.html` content (a Nexus Island) will then be loaded into the custom element.

3.  **Loading Indicators:**
    *   The `$router.loading` signal will be updated to `true` at the start of a navigation and `false` upon completion (or error).
    *   UI elements can declaratively bind to this signal using `data-show="$router.loading"` or `data-class-loading="$router.loading"` to display/hide loading feedback.

#### VI. File System Structure & Conventions (The Basis of Nexus Islands)

To maintain clarity and consistency, the following file structure conventions will be adopted, directly supporting **file-based routing** and forming the foundation of **Nexus Islands**:

*   **`src/plugins/official/core/watchers/router.ts`**: Contains the main `Router` core logic.
*   **`src/plugins/official/core/attributes/route.ts`**: Implements the `data-route` attribute plugin.
*   **`src/plugins/official/core/watchers/history.ts`**: Provides history management utilities.
*   **`site/`**: This directory will contain all the static HTML files that define the application's routes and components.
    *   **`site/index.html` (or `site/index.htm`):** This will serve as the application's entry point and the default route (`/`).
    *   **`site/_components/`**: This directory will house reusable HTML fragments or custom elements that can be included within any Nexus Island. These are not directly routable but are integral parts of the islands.
        *   Example: `site/_components/user-card.html`, `site/_components/navigation-bar.html`.
    *   **`site/_layouts/`**: This directory could contain larger, reusable HTML sections or layouts that are not full pages but are more substantial than simple components. They can be composed to form full routes.
        *   Example: `site/_layouts/user-layout.html`, `site/_layouts/product-listing.html`.
    *   **All other HTML files and directories/subdirectories within `site/` will serve as routes.** The path to an HTML file relative to the `site/` directory will directly correspond to its URL path.
        *   Example:
            *   `site/about.html` -> `/about`
            *   `site/users/[id].html` -> `/users/:id` (dynamic segment, where `[id]` is a placeholder for a parameter)
            *   `site/blog/[...slug].html` -> `/blog/*` (catch-all segment)
            *   `site/404.html` -> `/404` (for error handling)
    *   **Nexus Islands Basis:** Each of these static HTML files (e.g., `index.html`, `about.html`, `users/[id].html`) will be designed as a self-contained **Nexus Island**. This means they will contain their own HTML structure, declarative Nexus UX attributes (`data-*`), and potentially inline or external scripts/styles. When loaded by the router, Nexus UX will automatically make them reactive, enabling both server-driven and client-driven interactivity without requiring a separate client-side build step for each "island."

#### VII. Future Considerations

*   **Nested Routing:** Extend the `data-route` concept to support nested routes, where a parent component (a Nexus Island) can have its own designated content area for sub-routes, allowing for hierarchical island loading.
*   **Preloading Strategies:** Implement more advanced preloading (e.g., preloading on hover, preloading based on user behavior prediction) to further enhance perceived performance by pre-fetching Nexus Islands.
*   **Server-Side Rendering Integration:** Detail how a backend would pre-render the initial HTML, specifically populating the `data-component` attribute of the custom element and potentially pre-fetching data for initial signals. This would involve server-side logic to resolve the route and render the appropriate `data-component` attribute, ensuring the initial page load delivers a fully formed Nexus Island.

---