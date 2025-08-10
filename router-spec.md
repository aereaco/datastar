### Detailed Design Plan: Nexus UX Multiparadigm Router -- Revision 2025.08.06-02.25

The Nexus UX Multiparadigm Router is a flexible, client-side JavaScript module deeply integrated with the Nexus UX framework. Its core capability lies in orchestrating content delivery and managing navigation across various router modes: **Signal**, **Static**, and **Hybrid**. These modes enable the implementation of diverse routing paradigms, including Traditional Client-Side Routing (CSR), Traditional Server-Side Routing (SSR), Traditional Islands Routing, and Content Fragment Routing. This router adheres to Nexus UX's declarative, component-based, and minimal-JavaScript principles, offering an HTML-first approach with imperative control when needed.

#### I. Overall Architecture

The router's architecture is centered around the following principles:

1.  **Client-Side Core:** The router is a pure client-side JavaScript solution, completely decoupled from any specific backend technology. Its logic runs entirely in the browser.
2.  **Nexus UX Integration:** It is implemented as a Nexus UX plugin, leveraging Nexus UX's core engine, signal system, and existing attribute plugins for reactivity, DOM manipulation, and event handling.
3.  **Custom Elements as the Central Hub (The Router Outlet):** The router's core mechanism for content injection is updating the `$router.route` signal. Any custom element that binds its `data-component` attribute to `$router.route` will act as a router outlet. In most cases, there would only be a single custom element acting as the router outlet. However, multiple custom elements on a page can act as router outlets, all reacting to the same signal if needed.
    *Note: While custom element names are arbitrary, for clarity and developer experience, the primary router outlet should consistently be named `<router-outlet>` in all examples. Its functional role is determined by the Nexus UX signal its `data-component` attribute is bound to.*
    *   **Nested Components via Signals and `data-component`:** While a dedicated "nested routing" concept is not part of this design, the Nexus UX architecture inherently supports nested components. This is achieved by:
        *   **Hierarchical Signal Management:** Signals can be structured hierarchically (e.g., `$user.profile.name`). A parent component can manage a subset of signals, and child components can react to or update these signals.
        *   **Dynamic `data-component` Attributes:** Any custom element within a parent component can bind its `data-component` attribute to a signal that resolves to a component URL. For example, a parent component might have a signal `$currentTabComponent` which changes based on user interaction, and a child element `<div data-component="$currentTabComponent"></div>` would dynamically load different tab content.
        *   **Reactive Properties (`$props`):** As detailed in the "Component (`data-component`)" section, route parameters (from `$router.params`) are passed as reactive properties to loaded components via the `$props` signal. This allows parent components to pass relevant data down to their nested children, enabling them to render contextually.
        This approach provides the flexibility of nested UIs without the overhead of a separate routing mechanism for sub-sections of a page.
4.  **Layout Components vs. Router Outlets:**
    *   Layout Components (e.g., `<main-layout>`) are structural custom elements. They are not router outlets themselves. They may or may not contain a `<router-outlet>`.
    *   The placement of the `<router-outlet>` is highly flexible and entirely at the developer's discretion, driven by their architectural needs. It is not bound by any mandatory nesting within layouts.
5.  **`component.ts` as the Content Renderer:** The `component.ts` plugin is the exclusive mechanism for fetching, parsing, and injecting HTML content into the designated custom element, as well as managing the lifecycle and reactivity of the loaded `Component` instances. `component.ts` is highly versatile, capable of handling various content sources including URLs (with or without fragment identifiers), inline template ID references, inline template strings, and Data URLs. *Future exploration will include refactoring `component.ts` to utilize module imports and exports for increased security and performance, moving away from `new Function()` for script execution.*

**Router Activation:** The Nexus UX Router is optional and is activated only when the `data-router` attribute is present on the `<html>` tag. If this attribute is not present, the router will not initialize or interfere with standard browser navigation.

#### II. Core Router Concepts

This section defines the fundamental concepts of the Nexus UX Router, including its operating modes, the routing paradigms it supports, and the key internal state managed by the router.

##### A. Router Activation & Modes

The Nexus UX Router is optional but is activated by the presence of the `data-router` attribute on the `<html>` tag. When activating the plugin you must define a default route, eg. `data-router="{default: '#Home'}"`. The router supports three distinct modes:
Optionally, the router's operating mode can be defined by the presence of a `data-router.mode="<mode>"` attribute on the `<html>` tag. If not provided, the router will default to `hybrid` mode. You can also set both default route and mode at the same time, eg. `data-router="{default: '#Home', mode: 'hybrid'}"`.

*   `$router.mode`: (Initialized by `data-router` on `<html>`) Defines the router's operating mode:
    *   `signal`: Routes are defined as a JSON array within a `$router.routes` signal.
    *   `static`: Routes are defined by the static site structure itself.
    *   `hybrid`: Routes are defined first by `$router.routes` signal then by the static site; signal routes override static routes if any route path is defined in both.

##### B. Routing Paradigms

The Nexus UX router is designed to be versatile, supporting different routing paradigms based on project needs. Each approach offers a distinct user experience (UX) paradigm, allowing developers to select the most suitable model for their application's requirements. Layouts are optional for all routing approaches.

*   **Traditional Client-Side Routing (CSR):** Primarily aligns with a **Single Page Application (SPA)** UX, where the initial page load is followed by dynamic content updates without full page reloads.
*   **Traditional Server-Side Routing (SSR):** Correlates to a **Multi Page Application (MPA)** UX, where each navigation typically results in a full page reload, but with client-side hydration for enhanced interactivity on pre-rendered content.
*   **Traditional Islands Routing:** Represents a **Hybrid Application** UX, often referred to as a "partial SPA" or a modern MPA. Each route is a self-contained HTML document ("Island") that can be independently interactive, offering a balance between MPA simplicity and SPA-like interactivity.
*   **Content Fragment Routing:** Also a **Hybrid Application** UX, leaning more towards dynamic, SPA-like experiences. It focuses on updating specific content areas within a persistent layout, embodying principles of **Progressive Enhancement** and **Partial Hydration** for highly performant and fluid interactions.

##### C. Router Modes and Paradigm Alignment

The router's operating modes (`signal`, `static`, `hybrid`) provide unparalleled flexibility in how routes are defined and managed, supporting various routing paradigms. The choice of mode often depends on the desired implementation approach and the complexity of the application.

1.  **Signal Mode (`data-router.mode="signal"`)**
    *   **Definition:** Routes are explicitly defined as a JSON array within the `$router.routes` signal. This allows for highly dynamic and reactive route configurations.
    *   **Implementation Flexibility:**
        *   **Declarative HTML:** Routes can be directly embedded in the initial HTML payload using `data-router` attributes.
        *   **Client-Side JavaScript:** Routes can be imperatively added, modified, or removed via JavaScript, allowing for complex client-side logic to dictate routing.
        *   **Fetched/Streamed from Server:** Route definitions can be fetched from an API endpoint or streamed from the server, enabling dynamic route updates without a full page reload. This is particularly useful for applications with frequently changing navigation structures or user-specific routes.
    *   **Paradigm Alignment:** Signal mode is best aligned with **Traditional Client-Side Routing (CSR)** and **Content Fragment Routing**, where dynamic client-side control over routes is paramount. It can also be used in **Hybrid Applications** where a portion of routes are managed client-side.

2.  **Static Mode (`data-router.mode="static"`)**
    *   **Definition:** The file system structure of the static site itself serves as the routing manifest. The router infers routes based on conventions (e.g., `site/about.html` maps to `/about`).
    *   **Implementation Flexibility:**
        *   **File System Driven:** Routes are implicitly defined by the presence and path of HTML files within the `site/` directory. This simplifies route management for static content.
        *   **Convention-Based:** Dynamic segments (e.g., `[id]`, `[...slug]`) are resolved based on file naming conventions, providing a clear and predictable mapping between URLs and physical files.
    *   **Paradigm Alignment:** Static mode is primarily aligned with **Traditional Islands Routing** and can be used for simpler **Content Fragment Routing** scenarios where routes correspond directly to static HTML files. It promotes a more traditional web development workflow with the benefits of client-side enhancements.

3.  **Hybrid Mode (`data-router.mode="hybrid"`)**
    *   **Definition:** This mode combines the strengths of both `signal` and `static` modes. Routes are first defined by the `$router.routes` signal, and then by the static site structure. Signal-defined routes take precedence and override any static routes with the same path.
    *   **Implementation Flexibility:**
        *   **Unparalleled Control:** Developers can define core or dynamic routes via signals while leveraging the file system for static content or less frequently changing sections. This offers the highest degree of flexibility.
        *   **Progressive Enhancement:** Critical or dynamic routes can be managed with signals for immediate client-side responsiveness, while other content can fall back to static file-based routing.
        *   **Override Capability:** The ability for signal routes to override static routes allows for A/B testing, feature flags, or personalized routing experiences.
    *   **Paradigm Alignment:** Hybrid mode is ideal for complex **Hybrid Applications** and advanced **Content Fragment Routing** scenarios where a mix of dynamic and static route management is required. It provides a powerful mechanism for building highly performant and flexible web applications.

##### D. Key Internal State (Nexus UX Signals)

The `Router` Core Module manages its state as Nexus UX signals, making them reactive and accessible globally.

*   `$router.default`: The default route to navigate to when no specific route is matched. This is typically set to the home page (e.g., `/`).
*   `$router.mode`: The current operating mode of the router (`signal`, `static`, or `hybrid`).
*   `$router.routes`: Array of route definitions when in `signal` or `hybrid` mode.
*   `$router.path`: Current resolved URL path (e.g., `/users/123`).
*   `$router.params`: Object containing extracted route parameters (e.g., `{ id: '123' }`).
*   `$router.query`: Object containing URL query parameters.
*   `$router.hash`: Current URL hash fragment.
*   `$router.loading`: Boolean indicating if a navigation is in progress.
*   `$router.error`: Object/string for storing navigation errors (e.g., 404, guard failure).
*   `$router.previous`: The path before the current navigation.
*   `$router.layout`: This signal will hold the URL of a Layout Component to be loaded into a primary layout custom element (e.g., `<main-layout>`). This is used only for dynamic layouts in Content Fragment Routing.
*   `$router.route`: This signal will consistently hold the URL of the Content Fragment or Island to be loaded into the appropriate router outlet (i.e., any custom element binding to this signal).
*   `$router.meta`: An object containing custom metadata associated with the current route, defined via `data-route:meta`.
*   `$router.scroll`: An object `{ x: number, y: number }` representing the scroll position of the main content area, used for scroll restoration.
*   `$router.basePath`: The base path of the application, automatically detected from the initial URL or explicitly set via `data-router.base-path` on the `<html>` tag. All internal routing will be relative to this path.

To ensure the entire signal structure is initialized, `signals.merge` with `onlyIfMissing: true` will be called for the initial setup of the $router signals. This approach adds the missing signals without overwriting any existing values.

#### III. Router Components & Mechanisms

This section details the individual components that make up the Nexus UX Router and their specific functionalities. The router's core components (Router, Route, and History) are developed as independent modules, each exporting its functionality. This modular design allows them to
  be seamlessly imported into the main nexus-ux.ts and nexus-ux-aliased.ts bundles, consistent with the integration pattern established for all other official Nexus-UX
   plugins.

1.  **`Router` Core Module (`src/plugins/official/browser/attributes/router.ts`)**
    *   **Purpose:** The central singleton object managing all routing logic, history, and state. This file also contains the logic for route matching and handler execution.
    *   **Type:** Attribute Plugin (as it initializes global router services).
    *   **Responsibilities:**
        *   **Signal Tree Initialization:** If activated, the router will detect the `$router.mode` signal and then ensure the complete `$router` signal tree is initialized using `signals.merge` with `onlyIfMissing: true` for all other nested properties.
        *   **History Management:** Interact with the browser's History API (`pushState`, `replaceState`, `popstate`) to manage the URL and navigation stack.
        *   **Route Resolution:** Match the normalized application-relative path (derived from the current URL and `$router.basePath`) against defined route patterns, extract parameters, and identify the target content source.
        *   **Navigation Orchestration:** Coordinate the entire navigation process, including executing route guards, updating router state signals, and triggering content loading via `component.ts`.
        *   **Public API:** Expose methods for programmatic navigation (e.g., `navigate()`) and provide access to router state via Nexus UX signals.

2.  **Route Definition Mechanism (`src/plugins/official/browser/attributes/route.ts`)**
    *   **Purpose:** Augment route definitions with a `data-route` attribute for advanced configurations.
    *   **Type:** Attribute Plugin.
    *   **`data-route` Attribute Plugin:**
        *   **Syntax:** `<template data-route data-route:handler="myHandler" data-route:meta='{ "requiresAuth": true }' data-route:before-enter="onBeforeEnter" data-route:after-enter="onAfterEnter" data-route:before-leave="onBeforeLeave" data-route:after-leave="onAfterLeave" data-route:redirect="/new-path"></template>`
        *   **Functionality:** Allows associating handlers or other metadata directly within the HTML file itself. Parses path patterns (supporting dynamic segments like `:param`, `:param?`, `*`) if explicitly provided, or infers it from the file path. Associates optional `data-route:handler` (JavaScript function name or expression) with the route. The `data-route:meta` attribute allows attaching arbitrary JSON data to the route, which will be exposed via `$router.meta`.
            *   **Route Transition Hooks:** The `data-route:before-enter`, `data-route:after-enter`, `data-route:before-leave`, and `data-route:after-leave` attributes define JavaScript functions (similar to `data-route:handler`) that are executed at specific points during the navigation lifecycle. These functions receive the `ctx` object (including `AbortController`) and can return `false` to cancel navigation or a `string` to redirect.
            *   **Declarative Redirects:** The `data-route:redirect` attribute specifies a new path to redirect to. When a route with this attribute is matched, the router will automatically perform a `replaceState` navigation to the specified path.
        *   **Leverages:** Nexus UX's plugin system (`AttributePlugin`), `Router` core's route management.

3.  **History Management Utility (`src/plugins/official/browser/watchers/history.ts`)**
    *   **Purpose:** Provide a reusable module for interacting with the browser's History API.
    *   **Contents:** Functions for `pushState`, `replaceState`, and listening to `popstate` events.
    *   **Note:** While primarily used by the router, its separation allows for potential future use by other core Nexus UX functionalities if needed.



#### IV. Key Interactions and Flow

This section describes the typical flow of interactions within the router, from initial page load to client-side navigation and browser history management.

1.  **Router Initialization (on page load):**
    *   The Nexus UX engine loads and initializes all plugins, including the `Router` Attribute Plugin.
    *   The `Router` Attribute Plugin's `onLoad` method:
        *   **Base Path Detection:** The router will automatically determine its base path from the initial `window.location.pathname`.
            *   **Heuristic:** It identifies the base path by looking for the last path segment containing a file extension (e.g., `index.html`). If found, the base path is the directory containing that file. Otherwise (e.g., `pathname` ends with a `/` or no file extension in the last segment), the entire `pathname` is considered the base path.
            *   **Override:** If the `<html>` tag has a `data-router.base-path` attribute, its value will take precedence over the auto-detected base path.
            *   The determined base path will be stored in the `$router.basePath` signal.
        *   **URL Normalization:** All incoming URLs (from initial load, `popstate` events, or `navigate()` calls) will be normalized by stripping the `$router.basePath` to obtain an application-relative path. This relative path will be used for all internal route matching and signal updates.
        *   **Route Discovery:** The router discovers routes based on its configured mode:
            *   **Signal Mode:** Loads client-side defined route configurations from the `$router.routes` signal.
            *   **Static Mode:** Dynamically infers routes from the static site's file structure based on established conventions (e.g., `/users/123` maps to `site/users/[id].html`). No explicit manifest is loaded.
            *   **Hybrid Mode:** Combines signal-defined routes with static file-based routes, with signal routes taking precedence.
        *   Identifies the primary router outlet(s) in the DOM (e.g., `<router-outlet>` for static layouts, or `<main-layout>` for dynamic layouts).
        *   Performs an initial route resolution based on the normalized application-relative path. This includes **watching and intercepting direct address bar URL entries** for static files.
            *   **Error Handling and Recovery:** The router provides robust error handling mechanisms. If a navigation fails due to various reasons (e.g., route not found, network issues, errors in route guards, or component loading failures), the `$router.error` signal will be updated with relevant error information. For a `route not found` error, the router will automatically trigger a navigation to a special route, e.g., a static file like `site/404.html`. The `404.html` content will then be loaded into the custom element. Developers can subscribe to the `$router.error` signal to implement custom error displays or recovery logic.
        *   Updates `$router.path`, `$router.params`, etc., signals.
        *   **Sets the `$router.layout` signal** (if applicable for Content Fragment Routing with dynamic layouts) and **sets the `$router.route` signal** to the URL (or ID for inline templates) of the resolved content.
        *   The custom element(s) with `data-component` attributes will then be observed by `component.ts`. `component.ts` will fetch (if not already present from SSR), parse, inject, and activate Nexus UX on the content. This layered injection *is* the initial content activation, immediately becoming reactive due to Nexus UX's core capabilities.

2.  **Client-Side Navigation (Link Clicks):** (Applies to Signal, Static, and Hybrid modes)
    *   A global event listener (implemented using Nexus UX's `data-on-click` or an internal equivalent) intercepts clicks on `<a>` tags.
    *   If the link is internal and not explicitly marked `data-native` (or similar), `event.preventDefault()` is called.
    *   The Router core's `navigate()` method is called with the link's `href`.
    *   **`navigate()` Flow:**
        *   Sets `$router.loading = true`.
        *   **Route Transition Hooks (Before Leave):** Execute `data-route:before-leave` handlers for the current (leaving) route. If any handler returns `false` or a `string` (for redirect), the navigation is cancelled or redirected.
        *   **Route Transition Hooks (Before Enter):** Execute `data-route:before-enter` handlers for the new route. If any handler returns `false` or a `string` (for redirect), the navigation is cancelled or redirected.
        *   **Route Guards Execution:** The Router core will execute any `data-route:handler` functions for the new route sequentially.
            *   Handlers can be `async` functions, allowing for data fetching or API calls; the router will await their completion.
            *   Each navigation will have an `AbortController` passed to handlers, allowing long-running operations (like fetches) to be cancelled if the user navigates away.
            *   If a handler cancels (`false`) or redirects (`string`), the navigation stops or restarts.
        *   Updates browser history using `history.pushState()` (or `replaceState()` for redirects) with the `$router.basePath` prepended to the application-relative URL.
        *   Updates `$router.path`, `$router.params`, etc., signals.
        *   **Sets the `$router.layout` signal** (if applicable for Content Fragment Routing with dynamic layouts) and **sets the `$router.route` signal** to the URL (or ID) of the new content.
        *   `component.ts` takes over: fetches the static HTML file, parses, injects, and activates Nexus UX on the new content. This newly injected content becomes the active content, immediately becoming interactive through its declarative attributes.
        *   **Route Transition Hooks (After Enter):** After successful content loading and activation, execute `data-route:after-enter` handlers for the new route.
        *   Sets `$router.loading = false`.
        *   **Route Transition Hooks (After Leave):** After the current route's content has been removed/deactivated, execute `data-route:after-leave` handlers for the previous (left) route. These can leverage `component.ts`'s `disconnectedCallback` for cleanup.

3.  **Programmatic Navigation:**
    *   Developers call `window.$router.navigate('/new-path')` (or similar API exposed by the router).
    *   This directly invokes the `navigate()` flow described above, leading to the loading and activation of the target content.

4.  **Browser Back/Forward Buttons:** (Applies to Signal, Static, and Hybrid modes)
    *   The browser dispatches a `popstate` event.
    *   The Router core listens for `popstate`.
    *   It resolves the route based on the new `window.location`.
    *   It then triggers the content loading process by **setting the `$router.layout` signal** (if applicable for Content Fragment Routing with dynamic layouts) and **sets the `$router.route` signal**, similar to a programmatic navigation, but without pushing a new history entry. This also results in the loading and activation of the appropriate content.
    *   **Scroll Restoration:** The router will automatically restore the scroll position to the state saved in `history.state` for the previous entry, or to the top of the page if no saved position is found.

#### V. Data Fetching Workflows

Data fetching within the Nexus UX router is highly flexible and can occur at various stages, leveraging Nexus UX's declarative backend actions.

*   **Route Guards (`data-route:handler`):** For data required before the content fragment is even loaded, or for authentication/authorization checks. This ensures data is available in signals before the component attempts to render.
    ```html
    <!-- In a route template (e.g., <template data-route="/admin" data-route:handler="fetchAdminData"></template>) -->
    <script>
        async function fetchAdminData(ctx) {
            ctx.signals.setValue('$router.loading', true);
            try {
                const response = await fetch('/api/admin/dashboard');
                if (!response.ok) throw new Error('Failed to fetch admin data');
                const data = await response.json();
                ctx.signals.merge({ adminData: data });
                return true; // Allow navigation
            } catch (error) {
                ctx.signals.setValue('$router.error', 'Admin data error: ' + error.message);
                return false; // Prevent navigation
            } finally {
                ctx.signals.setValue('$router.loading', false);
            }
        }
    </script>
    ```
*   **`data-on-load` within Components/Fragments:** For data specific to a component or content fragment that can be fetched once it is loaded into the DOM.
    ```html
    <!-- In a content fragment (e.g., site/products/[id].html) -->
    <template>
        <div data-on-load="@get('/api/products/' + $router.params.id, { mergeSignals: true })">
            <h2>Product: <span data-text="$product.name"></span></h2>
            <p>Price: <span data-text="$product.price"></span></p>
        </div>
    </template>
    ```
*   **`data-on-signal-change`:** For data that needs to reactively update based on changes to router parameters or other signals within a component or fragment.
    ```html
    <!-- In a content fragment -->
    <template>
        <div data-on-signal-change="$router.params.category, @get('/api/products?category=' + $router.params.category, { mergeSignals: true })">
            <h3>Products in <span data-text="$router.params.category"></span></h3>
            <ul data-each="$item in $products">
                <li data-text="$item.name"></li>
            </ul>
        </div>
    </template>
    ```
*   **Form Submissions:** Standard Nexus UX form handling can be used to submit data and receive updates.
    ```html
    <!-- In a content fragment -->
    <template>
        <form data-on-submit="@post('/api/submit-feedback', { mergeSignals: true })">
            <textarea name="feedback"></textarea>
            <button type="submit">Submit Feedback</button>
        </form>
    </template>
    ```

#### VI. Leveraging Nexus UX Plugins

This section details how existing Nexus UX plugins will be directly utilized or adapted for the router.

1.  **`Signals` (`data-router-*`) & `Computed` (`data-computed-*`)**:
    *   **Router State:** The core router module will manage its state (`$router.path`, `$router.params`, `$router.loading`, `$router.error`, `$router.layout`, `$router.route`, etc.) as Nexus UX signals. These will be accessible globally (e.g., `ctx.signals.signal('$router.path').value`).
    *   **Reactive UI:** Any element can react to router state changes:
        ```html
        <div data-show="$router.loading">Loading route...</div>
        <h1 data-text="$router.path"></h1>
        <p data-text="$router.params.id"></p>
        <a href="/" data-class-active="$router.path === '/'">Home</a>
        ```
    *   **Computed Route Status:**
        ```html
        <div data-computed-isActiveUserPage="$router.path.startsWith('/users/')"></div>
        ```

2.  **`Component` (`data-component`)**:
    *   **Central Role:** This plugin is the *sole* mechanism for loading content into the designated custom elements. The router's job is to update the `$router.route` signal, which the custom elements' `data-component` attributes are bound to.
    *   **Reactive Properties to Components:** Route parameters (from `$router.params`) will be automatically passed as reactive properties to the loaded `Component` instances via the `$props` signal. For example, if the route is `/users/:id`, the `UserComponent` loaded into the custom element will receive `$props.id` as a signal.
    *   **Component Lifecycle:** The `connectedCallback` and `disconnectedCallback` of `Component` will be used for component-specific setup and cleanup, ensuring proper resource management during route changes.
    *   **Component-Level Error Handling:** While `component.ts` itself does not contain error boundaries, component-level rendering errors can be managed by implementing `try-catch` logic in the utility that updates the `data-component`'s source signal (e.g., `$router.route`). If an error occurs during data fetching or processing *before* the signal is updated, the `$router.error` signal can be set, and a fallback component (e.g., an error message component) can be loaded by updating the `data-component` signal with an error-specific source.

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

5.  **URL Generation Utility (`router.url()`):**
    *   **Purpose:** Provide a programmatic way to generate URLs based on named routes, improving maintainability and reducing hardcoded paths.
    *   **Mechanism:** The `Router` core module will expose a public utility function, `router.url(name: string, params?: object, query?: object, hash?: string)`, that constructs a full URL.
        *   **Named Route Registration:** When a `<template data-route>` is processed by the `route.ts` plugin, if it includes a `data-route:meta` attribute with a `name` property (e.g., `data-route:meta='{ "name": "userProfile" }'`), this name and its resolved path pattern (e.g., `/users/:id`) will be registered in an internal map within `router.ts`.
        *   **URL Construction:** The `router.url()` function will look up the path pattern associated with the provided `name`. It will then interpolate the `params` object into the dynamic segments of the path (e.g., replacing `:id` with `params.id`). Query parameters and hash fragments will be appended as specified.
        *   **Integration with File System Routing:** Named routes serve as an *overlay* or *alias* mechanism. The file system remains the primary source of truth for route discovery and content resolution. Named routes simply provide a convenient programmatic handle for specific, well-defined routes that are also discoverable via the file system.
        *   **Example:**
            ```javascript
            // Assuming a route defined as: <template data-route="/users/:id" data-route:meta='{ "name": "userProfile" }'></template>
            const userUrl = window.$router.url('userProfile', { id: 123 }, { tab: 'posts' }, 'comments');
            // userUrl would resolve to: "/users/123?tab=posts#comments"
            
            // Use in declarative HTML:
            // <a data-on-click="@router.navigate($router.url('userProfile', { id: $user.id }))">View Profile</a>
            ```
    *   **Leverages:** `Router` core module, `Route` attribute plugin.

6.  **`MergeFragments` (Watcher) & `ViewTransition` (`data-view-transition`)**:
    *   **Smooth Transitions:** When `component.ts` injects new content into the custom element, it can be configured to leverage the View Transition API. The `MergeFragments` watcher's underlying use of Idiomorph and its `useViewTransition` option provides a blueprint for this. The router will ensure that the `data-component` update (triggered by the signal change) initiates a view transition for the entire custom element's content change.
    *   **Element-level Transitions:** Components loaded by the router can use `data-view-transition="unique-name"` on their internal elements to create fine-grained transitions during route changes.

7.  **`MergeSignals` & `RemoveSignals` (Watchers)**:
    *   **Route Guard Data:** Route handlers (guards) can fetch data and then use `ctx.signals.merge()` to make that data available as global signals before the component renders.
    *   **Cleanup:** When navigating away from a route, the router can trigger `ctx.signals.remove()` for signals specifically associated with the previous route, preventing memory leaks and stale data. This could be part of a `data-route:cleanup` handler.

8.  **`ScrollIntoView` (`data-scroll-into-view`)**:
    *   **Comprehensive Scroll Restoration:** The router will leverage this plugin to manage scroll positions across navigations.
        *   When navigating away from a page, the current scroll position will be saved to `history.state`.
        *   When navigating back/forward, the router will retrieve the saved scroll position from `history.state` and apply `data-scroll-into-view` to the main content area or a specific element to restore the previous scroll position.
    *   **Programmatic Scroll Control:** The router will expose a `router.scrollTo(selectorOrElement: string | HTMLElement, options?: ScrollIntoViewOptions)` method. This allows developers to imperatively scroll to any element on the page, useful for scenarios not directly tied to route changes (e.g., scrolling to a form field after validation, or to a specific section within a dynamically loaded content fragment).
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
    *   **Post-Render Initialization:** Components loaded by the router can use `data-on-load` for any JavaScript initialization that needs to happen *after* the component's HTML is in the DOM and Nexus UX has processed its attributes.
        ```html
        <!-- In a routed component's template -->
        <div data-on-load="initMap()">
          <!-- Map container -->
        </div>
        ```

#### VII. File System Structure & Conventions

To maintain clarity and consistency for routing, the following file structure conventions will be adopted:

*   **`src/plugins/official/browser/attributes/router.ts`**: Contains the main `Router` core logic.
*   **`src/plugins/official/browser/attributes/route.ts`**: Implements the `data-route` attribute plugin.
*   **`src/plugins/official/browser/watchers/history.ts`**: Provides history management utilities.
*   **`site/`**: This directory will contain all the static HTML files that define the application's routes and components.
    *   **`site/index.html` (or `site/index.htm`):** This will serve as the application's entry point and the default route (`/`). It will contain the primary router outlet, `<router-outlet>`, whose `data-component` attribute is bound to `$router.route`.
    *   **`site/_components/`**: This directory will house reusable HTML fragments or custom elements. These are not directly routable.
        *   Example: `site/_components/user-card.html`, `site/_components/navigation-bar.html`.
    *   **`site/_layouts/`**: This directory will contain HTML files defining **Layout Components**. These are not directly routable by the router, but are intended to be loaded as components (e.g., into a `<main-layout>` custom element) and provide structural consistency. A layout component may contain a `<router-outlet>` for content fragments if desired.
        *   Example: `site/_layouts/main-layout.html`.
    *   **All other HTML files and directories/subdirectories within `site/` (excluding `_components/` and `_layouts/`) will serve as routable content.**
        *   For **Traditional Islands Routing**, these files are full HTML documents (Islands).
        *   For **Content Fragment Routing**, these files are pure content fragments.
        *   Example:
            *   `site/about.html` -> `/about` (relative to `$router.basePath`)
            *   `site/users/[id].html` -> `/users/:id` (relative to `$router.basePath`)
            *   `site/blog/[...slug].html` -> `/blog/*` (relative to `$router.basePath`)
            *   `site/404.html` -> `/404` (relative to `$router.basePath`)

#### VIII. Technical Implementation Steps

This section outlines the detailed technical steps required to implement the Nexus UX Multiparadigm Router. Each step is designed to be a self-contained task, building upon previous functionality.

**Phase 1: Core Utilities and Signal Setup**

1.  **Create Router-Specific Files:**
    *   Create `src/plugins/official/browser/attributes/router.ts`.
    *   Create `src/plugins/official/browser/attributes/route.ts`.
    *   Create `src/plugins/official/browser/watchers/history.ts`.

2.  **Implement `history.ts` Utilities:**
    *   In `src/plugins/official/browser/watchers/history.ts`:
        *   Define and export `pushState(url: string, data?: any)`: A wrapper around `window.history.pushState`.
        *   Define and export `replaceState(url: string, data?: any)`: A wrapper around `window.history.replaceState`.
        *   Implement a `popstate` event listener that dispatches a custom event (e.g., `router:popstate`) with the new URL. This event will be consumed by the `router.ts` module.

3.  **Define Core Router Signals:**
    *   In `src/plugins/official/browser/attributes/router.ts`:
        *   Initialize the following Nexus UX signals within the `Router` module's `onLoad` method:
            *   `$router.path`: `ctx.signals.upsertIfMissing('$router.path', '')`
            *   `$router.params`: `ctx.signals.upsertIfMissing('$router.params', {})`
            *   `$router.query`: `ctx.signals.upsertIfMissing('$router.query', '')`
            *   `$router.hash`: `ctx.signals.upsertIfMissing('$router.hash', '')`
            *   `$router.loading`: `ctx.signals.upsertIfMissing('$router.loading', false)`
            *   `$router.error`: `ctx.signals.upsertIfMissing('$router.error', null)`
            *   `$router.previous`: `ctx.signals.upsertIfMissing('$router.previous', '')`
            *   `$router.layout`: `ctx.signals.upsertIfMissing('$router.layout', null)`
            *   `$router.route`: `ctx.signals.upsertIfMissing('$router.route', null)`

**Phase 2: `Router` Core Module Implementation (`router.ts`)**

1.  **Basic `Router` Attribute Plugin Structure:**
    *   Define `Router` as an `AttributePlugin` in `src/plugins/official/browser/attributes/router.ts`.
    *   Implement its `onLoad` method.

2.  **Initial Page Load Handling:**
    *   Inside `Router.onLoad`:
        *   Attach a listener for the `router:popstate` event (from `history.ts`).
        *   Implement `resolveAndLoadRoute(url: string)` function:
            *   This function will be the central point for processing a new URL.
            *   It should parse the URL, extract path, query, and hash.
            *   It should update `$router.path`, `$router.query`, `$router.hash` signals.
            *   It should set `$router.loading.value = true`.
            *   It should call a route matching function (to be implemented later) to determine the target content URL.
            *   It should update `$router.layout` and `$router.route` signals based on the matched route.
            *   Set `$router.loading.value = false` after content loading is initiated.
        *   Call `resolveAndLoadRoute(window.location.href)` to handle the initial page load.

3.  **Programmatic Navigation (`navigate()`):**
    *   Define and export a `navigate(url: string, options?: { replace?: boolean })` function within the `Router` module.
    *   This function should:
        *   Save the current scroll position to `history.state` before navigating.
        *   Update `$router.previous` with the current `$router.path.value`.
        *   Call `history.pushState()` or `history.replaceState()` based on `options.replace`.
        *   Call `resolveAndLoadRoute(url)`.

4.  **Route Matching Logic:**
    *   Implement a robust route matching algorithm within `src/plugins/official/browser/attributes/router.ts` (or a helper utility). This algorithm should:
        *   Support static paths (e.g., `/about`).
        *   Support dynamic segments (e.g., `/users/:id`).
        *   Support optional dynamic segments (e.g., `/blog/:year?/:month?`).
        *   Support catch-all segments (e.g., `/files/*`, `/docs/[...slug]`).
        *   Prioritize more specific routes over less specific ones.
        *   Extract route parameters and update `$router.params` signal.
    *   This function will be called by `resolveAndLoadRoute`.

5.  **Error Handling and Recovery (404):**
    *   Enhance `resolveAndLoadRoute` to handle cases where no route matches the requested URL.
    *   If no match is found, set `$router.error.value = { type: '404', message: 'Page not found' }`.
    *   Automatically call `navigate('/404.html', { replace: true })` to redirect to the 404 page.
    *   Ensure the `site/404.html` file exists and contains appropriate content.

6.  **Loading Indicators:**
    *   Ensure `$router.loading` signal is correctly set to `true` at the beginning of `resolveAndLoadRoute` and `false` at its completion (or if an error occurs).

**Phase 3: `Route` Attribute Plugin Implementation (`route.ts`)**

1.  **`Route` Attribute Plugin Structure:**
    *   Define `Route` as an `AttributePlugin` in `src/plugins/official/browser/attributes/route.ts`.
    *   Implement its `onLoad` method.

2.  **Route Definition and Registration:**
    *   Inside `Route.onLoad(ctx)`:
        *   Access the `<template data-route>` element (`ctx.el`).
        *   Extract the route pattern (if explicitly provided, otherwise infer from file path conventions).
        *   Extract `data-route:handler` attribute value.
        *   Register this route with the `Router` core module (e.g., via a public method on the `Router` instance, or by updating a shared signal that the `Router` observes). This registration should include the pattern, the handler reference, and the component URL (which would be the `src` of the template or inferred from the file path).

3.  **Route Handler Execution and Transition Hooks:**
    *   In `src/plugins/official/browser/attributes/router.ts`:
        *   **Before Enter Hooks:** Execute `data-route:before-enter` handlers for the new route. If any handler returns `false` or a `string` (for redirect), the navigation is cancelled or redirected.
        *   Retrieve the associated `data-route:handler` function.
        *   Execute the handler, passing the `RuntimeContext` (or a subset of it, including `$router.params`, `$router.query`, and an `AbortController`).
        *   Handle return values: `false` for cancellation, `string` for redirection.
        *   Implement `async`/`await` support for handlers.
        *   **After Enter Hooks:** After successful content loading and activation, execute `data-route:after-enter` handlers for the new route.
    *   When navigating away from a route:
        *   **Before Leave Hooks:** Execute `data-route:before-leave` handlers for the current (leaving) route. If any handler returns `false` or a `string` (for redirect), the navigation is cancelled or redirected.
        *   **After Leave Hooks:** After the current route's content has been removed/deactivated, execute `data-route:after-leave` handlers for the previous (left) route. These can leverage `component.ts`'s `disconnectedCallback` for cleanup.

**Phase 4: `Component` Plugin Verification and Integration**

1.  **Verify `data-component` Flexibility:**
    *   Review the existing `src/plugins/official/browser/attributes/component.ts` to confirm it fully supports:
        *   Static URLs (e.g., `"/pages/about.html"`)
        *   URLs with Fragment Identifiers (e.g., `"/shared/templates.html#my-section"`)
        *   Inline Template ID References (e.g., `"#my-inline-template"`)
        *   Inline Template Strings (e.g., `"<template><h1>Hello!</h1></template>"`)
        *   Data URLs (e.g., `"data:text/html;base64,..."`)
        *   Dynamic Signals (e.g., `"$router.route"`)
    *   Ensure the `getTemplateHtml` and `parseComponentHTML` functions within `component.ts` correctly handle these variations.

2.  **Reactive Properties (`$props`):**
    *   Confirm that `component.ts` correctly passes route parameters (from `$router.params`) as reactive properties to the loaded `Component` instances via the `$props` signal. This involves mapping `$router.params.id` to `$props.id` within the component's scope, and also handles nested parameters (e.g., `$router.params.user.id` mapping to `$props.user.id`).

**Phase 5: Integration, Testing, and Refinement**

1.  **Example HTML Files:**
    *   Create a set of example HTML files in the `site/` directory demonstrating each routing paradigm (CSR, SSR, Islands, Content Fragments) and their respective layout scenarios.
    *   Include examples of dynamic segments, query parameters, and hash fragments.

2.  **Unit Tests:**
    *   Write comprehensive unit tests for:
        *   `history.ts`: Verify `pushState`, `replaceState`, and `popstate` event dispatching.
        *   `router.ts`: Test URL parsing, route matching logic (all segment types), signal updates, `navigate()` behavior, and error handling.
        *   `route.ts`: Test attribute parsing and route registration.
        *   `component.ts`: Test all `data-component` source types and `$props` passing.

3.  **Integration Tests:**
    *   Develop end-to-end integration tests that simulate user interactions (link clicks, programmatic navigation, browser back/forward) and verify:
        *   Correct content loading and injection into router outlets.
        *   Accurate updates of all `$router` signals.
        *   Proper execution of route guards (cancellation, redirection).
        *   Correct display of loading indicators.
        *   Seamless view transitions (if enabled).
        *   Correct behavior of anchor scrolling and focus management.

4.  **Performance Testing:**
    *   For "Traditional Islands Routing," conduct performance tests to measure page load times and identify potential bottlenecks due to larger HTML payloads. Optimize as needed (e.g., consider preloading strategies).

5.  **Security Review:**
    *   Thoroughly review `component.ts` and any code that handles dynamic script execution or content injection for potential XSS vulnerabilities. Implement strict content sanitization where user-provided content might be involved.

6.  **Documentation Updates:**
    *   As development progresses, update inline code comments and the `router-spec.md` document to reflect any changes or new insights gained during implementation.
    *   Add a "Known Issues" or "Limitations" section if any arise.

This detailed plan provides a structured approach to developing the Nexus UX Multiparadigm Router, ensuring all aspects of the design are addressed systematically.