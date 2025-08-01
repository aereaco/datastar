### Detailed Design Plan: Nexus UX Multiparadigm Router -- Revision 2025.07.30-22.15

The Nexus UX Multiparadigm Router is designed as a flexible, client-side JavaScript module deeply integrated with the Nexus UX framework. Its core capability lies in orchestrating content delivery and managing navigation across various paradigms: **Traditional Client-Side Routing (CSR)**, **Traditional Server-Side Routing (SSR)**, **Traditional Islands Routing**, and our preferred **Content Fragment Routing**. This router adheres to Nexus UX's declarative, component-based, and minimal-JavaScript principles, offering an HTML-first approach with imperative control when needed.

#### I. Overall Architecture

The router's architecture is centered around the following principles:

1.  **Client-Side Core:** The router is a pure client-side JavaScript solution, completely decoupled from any specific backend technology. Its logic runs entirely in the browser.
2.  **Nexus UX Integration:** It is implemented as a Nexus UX plugin, leveraging Nexus UX's core engine, signal system, and existing attribute plugins for reactivity, DOM manipulation, and event handling.
3.  **Custom Elements as the Central Hub (The Router Outlet):** The router's core mechanism for content injection is updating the `$router.currentPageComponentUrl` signal. Any custom element that binds its data-component attribute to $router.currentPageComponentUrl will act as a router outlet. In most cases there would only be only a single custom element acting as the router outlet. However, there can be multiple custom elements on a page acting as router outlets, all reacting to the same signal if needed.
    *Note: While custom element names are arbitrary, for clarity and developer experience, the primary router outlet should consistently be named `<router-outlet>` in all examples. Its functional role is determined by the Nexus UX signal its `data-component` attribute is bound to.*
4.  **Layout Components vs. Router Outlets:**
    *   Layout Components (e.g., `<main-layout>`) are structural custom elements. They are not router outlets themselves. They may or may not contain a `<router-outlet>`.
    *   The placement of the `<router-outlet>` is highly flexible and entirely at the developer's discretion, driven by their architectural needs. It is not bound by any mandatory nesting within layouts.
5.  **`component.ts` as the Content Renderer:** The `component.ts` plugin is the exclusive mechanism for fetching, parsing, and injecting HTML content into the designated custom element, as well as managing the lifecycle and reactivity of the loaded `NexusUXComponent` instances. `component.ts` is highly versatile, capable of handling various content sources including URLs (with or without fragment identifiers), inline template ID references, inline template strings, and Data URLs. *Future exploration will include refactoring `component.ts` to utilize module imports and exports for increased security and performance, moving away from `new Function()` for script execution.*

#### II. Core Components of the Router

The router consists of the following key components:

1.  **`Router` Core Module (`src/plugins/official/core/watchers/router.ts`)**
    *   **Purpose:** The central singleton object managing all routing logic, history, and state. This file also contains the logic for route matching and handler execution.
    *   **Type:** Watcher Plugin (as it initializes global router services).
    *   **Responsibilities:**
        *   **History Management:** Interact with the browser's History API (`pushState`, `replaceState`, `popstate`) to manage the URL and navigation stack.
        *   **Route Resolution:** Match the current URL path (whether from direct address bar entry or link clicks) against defined route patterns, extract parameters, and identify the target content source.
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
        *   `$router.currentLayoutComponentUrl` (Re-introduced & Clarified): This signal will hold the URL of a Layout Component to be loaded into a primary layout custom element (e.g., `<main-layout>`). This is used only for dynamic layouts in Content Fragment Routing.
        *   `$router.currentPageComponentUrl`: This signal will consistently hold the URL of the Content Fragment or Island to be loaded into the appropriate router outlet (i.e., any custom element binding to this signal).
        *   `$router.currentNestedComponentUrl`: A signal that will hold the URL (or ID for inline templates) of the Content Fragment or Island to be loaded into a nested router outlet.
        *   `$router.currentRoute.meta`: An object containing custom metadata associated with the current route, defined via `data-route:meta`.
        *   `$router.scrollPosition`: An object `{ x: number, y: number }` representing the scroll position of the main content area, used for scroll restoration.
    *   **Dependencies:** `SignalsRoot` (from Nexus UX core), `History API` (via `history.ts`), `component.ts` (indirectly via `data-component` attribute).

2.  **Route Definition Mechanism (`src/plugins/official/core/attributes/route.ts`)**
    *   **Purpose:** Augment route definitions with a `data-route` attribute for advanced configurations.
    *   **Type:** Attribute Plugin.
    *   **`data-route` Attribute Plugin:**
        *   **Syntax:** `<template data-route data-route:handler="myHandler" data-route:meta='{ "requiresAuth": true }' data-route:before-enter="onBeforeEnter" data-route:after-enter="onAfterEnter" data-route:before-leave="onBeforeLeave" data-route:after-leave="onAfterLeave" data-route:redirect="/new-path"></template>`
        *   **Functionality:** Allows associating handlers or other metadata directly within the HTML file itself. Parses path patterns (supporting dynamic segments like `:param`, `:param?`, `*`) if explicitly provided, or infers it from the file path. Associates optional `data-route:handler` (JavaScript function name or expression) with the route. The `data-route:meta` attribute allows attaching arbitrary JSON data to the route, which will be exposed via `$router.currentRoute.meta`.
            *   **Route Transition Hooks:** The `data-route:before-enter`, `data-route:after-enter`, `data-route:before-leave`, and `data-route:after-leave` attributes define JavaScript functions (similar to `data-route:handler`) that are executed at specific points during the navigation lifecycle. These functions receive the `ctx` object (including `AbortController`) and can return `false` to cancel navigation or a `string` to redirect.
            *   **Declarative Redirects:** The `data-route:redirect` attribute specifies a new path to redirect to. When a route with this attribute is matched, the router will automatically perform a `replaceState` navigation to the specified path.
        *   **Leverages:** Nexus UX's plugin system (`AttributePlugin`), `Router` core's route management.

3.  **History Management Utility (`src/plugins/official/core/watchers/history.ts`)**
    *   **Purpose:** Provide a reusable module for interacting with the browser's History API.
    *   **Contents:** Functions for `pushState`, `replaceState`, and listening to `popstate` events.
    *   **Note:** While primarily used by the router, its separation allows for potential future use by other core Nexus UX functionalities if needed.

4.  **Nested Routing (`data-route:nested`)**
    *   **Purpose:** Extend the `data-route` concept to support hierarchical routing, allowing parent components to define their own sub-routes and dedicated content areas.
    *   **Mechanism:** A `data-route:nested` attribute (or similar convention) on a custom element will designate it as a nested router outlet. The router will manage the `data-component` attribute of this nested outlet based on sub-path matching. This enables complex UI compositions where different parts of the page can be independently routed.
    *   **Leverages:** Nexus UX's `Component` plugin for loading content, and the `Router` core's path resolution logic.

#### III. Multiparadigm Routing Approaches

The Nexus UX router is designed to be versatile, supporting different routing paradigms based on project needs. Each approach offers a distinct user experience (UX) paradigm, allowing developers to select the most suitable model for their application's requirements.

*   **Traditional Client-Side Routing (CSR):** Primarily aligns with a **Single Page Application (SPA)** UX, where the initial page load is followed by dynamic content updates without full page reloads.
*   **Traditional Server-Side Routing (SSR):** Correlates to a **Multi Page Application (MPA)** UX, where each navigation typically results in a full page reload, but with client-side hydration for enhanced interactivity on pre-rendered content.
*   **Traditional Islands Routing:** Represents a **Hybrid Application** UX, often referred to as a "partial SPA" or a modern MPA. Each route is a self-contained HTML document ("Island") that can be independently interactive, offering a balance between MPA simplicity and SPA-like interactivity.
*   **Content Fragment Routing:** Also a **Hybrid Application** UX, leaning more towards dynamic, SPA-like experiences. It focuses on updating specific content areas within a persistent layout, embodying principles of **Progressive Enhancement** and **Partial Hydration** for highly performant and fluid interactions.

**Layouts are optional for all routing approaches.**

##### A. Traditional Client-Side Routing (CSR)

In a traditional CSR setup, the server typically serves a single HTML file (e.g., `index.html`), and all subsequent navigation and content rendering are handled by client-side JavaScript. The Nexus UX router can be configured to operate in this mode, fetching HTML fragments or full pages and injecting them into a designated area.

**Implementation Details:**

1.  **Initial Page Load:** The server delivers a base `index.html` that includes the Nexus UX library and the router. This `index.html` will contain the primary router outlet, `<router-outlet>`, whose `data-component` attribute is bound to `$router.currentPageComponentUrl`. In this single-level CSR setup, `<router-outlet>` serves as the sole content injection point, directly receiving the page content.
    ```html
    <!-- public/index.html -->
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CSR App</title>
        <script type="module" src="/path/to/datastar.js"></script>
        <script type="module">
            import { load, apply, setAlias } from '/path/to/datastar.js';
            // Load router and other plugins
            // load(Router, ...);
            // apply();
            // setAlias('ds'); // Or your preferred alias
        </script>
    </head>
    <body>
        <nav>
            <a href="/" data-on-click="@router.navigate('/')">Home</a>
            <a href="/about" data-on-click="@router.navigate('/about')">About</a>
            <a href="/contact" data-on-click="@router.navigate('/contact')">Contact</a>
        </nav>
        <main>
            <!-- The main router outlet -->
            <router-outlet data-component="$router.currentPageComponentUrl"></router-outlet>
        </main>
    </body>
    </html>
    ```

2.  **Route Definition (Client-Side):** In a pure CSR setup, you would typically define your routes and their corresponding content URLs directly within your client-side router configuration. This could be an array of objects that the `Router` core module processes during its `onGlobalInit`.
    ```typescript
    // src/plugins/official/core/watchers/router.ts (conceptual)
    // This would be part of the Router's internal configuration
    const routes = [
        { path: '/', component: '/fragments/home.html' },
        { path: '/about', component: '/fragments/about.html' },
        { path: '/contact', component: '/fragments/contact.html' },
        { path: '/users/:id', component: '/fragments/user-detail.html' },
        // ... other routes
    ];

    // Inside Router's onGlobalInit:
    // Match current URL against 'routes' and set $router.currentPageComponentUrl
    // e.g., signals.setValue('$router.currentPageComponentUrl', matchedRoute.component);
    ```
    The `fragments/home.html`, `fragments/about.html`, etc., would be static HTML files served by the web server, containing the content for each route.

3.  **Navigation:**
    *   **Declarative (Link Clicks):** Use `data-on-click="@router.navigate('/path')"` on `<a>` tags. This intercepts the click, prevents default browser navigation, and triggers the router's `navigate` method.
        ```html
        <a href="/about" data-on-click="@router.navigate('/about')">About Us</a>
        ```
    *   **Imperative (Programmatic):** Call `window.$router.navigate('/new-path')` from any JavaScript code.
        ```javascript
        // Example: In a component's script
        function goToDashboard() {
            window.$router.navigate('/dashboard');
        }
        ```

4.  **Content Injection:** When `router.navigate()` is called, the router resolves the new path to a component URL (e.g., `/fragments/about.html`) and updates the `$router.currentPageComponentUrl` signal. The `<router-outlet>` element, bound via `data-component="$router.currentPageComponentUrl"`, then uses `component.ts` to fetch and inject the new content.

5.  **Data Fetching Workflow:**
    In CSR, data fetching typically occurs client-side after the route has been activated and the component is loaded. Nexus UX provides several declarative ways to fetch data:
    *   **`data-on-load`:** For data needed immediately when a component is loaded.
        ```html
        <!-- In a routed component's template (e.g., /fragments/user-detail.html) -->
        <div data-on-load="@get('/api/users/' + $router.params.id, { mergeSignals: true })">
            <h2 data-text="$user.name"></h2>
            <p>Email: <span data-text="$user.email"></span></p>
        </div>
        ```
        Here, `@get` is a Nexus UX backend action that fetches data and merges it into the global signals, making it reactive.
    *   **`data-on-signal-change`:** For data that depends on reactive router parameters or other signals.
        ```html
        <!-- In a routed component's template -->
        <div data-on-signal-change="$router.params.id, @get('/api/products/' + $router.params.id, { mergeSignals: true })">
            <h2 data-text="$product.name"></h2>
        </div>
        ```
    *   **Route Guards (`data-route:handler`):** For data that needs to be fetched *before* the component is rendered, or to gate access to a route.
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
        This approach ensures data is available before the UI attempts to render it, preventing flashes of empty states.

##### B. Traditional Server-Side Routing (SSR)

In a traditional SSR setup, the server renders the full HTML for each requested URL and sends it to the client. Client-side JavaScript then "hydrates" this pre-rendered content, making it interactive. The Nexus UX router supports SSR by focusing on hydration and enabling interactivity on server-rendered pages. **Subsequent navigations remain full page reloads handled by the server.**

**Implementation Details:**

1.  **Initial Page Load (Server-Rendered):** The backend renders the complete HTML page, including the content for the initial route. The Nexus UX library and router are included. Crucially, the server can pre-populate the `data-component` attribute of the primary router outlet with the URL of the initial content, and potentially inject initial signal data.
    ```html
    <!-- Server-rendered HTML for /users/123 -->
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Profile</title>
        <script type="module" src="/path/to/datastar.js"></script>
        <script type="module">
            import { load, apply, setAlias } from '/path/to/datastar.js';
            // Load router and other plugins
            // load(Router, ...);
            // apply(); // This will hydrate the existing DOM
            // setAlias('ds');

            // Hydrate initial signals from server-provided data
            const initialStateEl = document.getElementById('initial-state');
            if (initialStateEl) {
                const initialState = JSON.parse(initialStateEl.textContent);
                // signals.merge(initialState, true); // Merge only if missing
            }
        </script>
    </head>
    <body>
        <nav>
            <!-- Standard links for server-side navigation -->
            <a href="/">Home</a>
            <a href="/users/124">Next User</a>
        </nav>
        <main>
            <!-- The primary router outlet -->
            <router-outlet data-component="/pages/user-profile.html">
                <!-- Content for /users/123 pre-rendered by the server within the router outlet -->
                <h1>User ID: 123</h1>
                <p>Name: John Doe</p>
                <!-- ... other content ... -->
            </router-outlet>
        </main>
        <!-- Server can inject initial data for client-side signals -->
        <script type="application/json" id="initial-state">
            { "user": { "id": 123, "name": "John Doe" } }
        </script>
    </body>
    </html>
    ```

2.  **Hydration:** When `apply()` is called on the client, Nexus UX will process the existing DOM. The `<router-outlet>` custom element, already present and containing pre-rendered content, will be "hydrated." Its `data-component` attribute will be observed, but since the content is already there, `component.ts` will primarily attach event listeners and activate Nexus UX attributes within the existing DOM, rather than re-fetching.

3.  **Subsequent Navigation:** In this traditional SSR model, subsequent navigations (e.g., clicking a link to `/users/124`) are handled by the server. The browser performs a full page reload, and the server delivers the new HTML content. The client-side Nexus UX router's role is limited to hydrating the newly loaded page.

4.  **Data Fetching Workflow:**
    In SSR, the primary data fetching occurs on the server before the page is sent to the client. The client-side Nexus UX framework then hydrates this pre-rendered content. For any dynamic data that needs to be updated client-side after initial render, standard Nexus UX data fetching mechanisms can be used within the hydrated components:
    *   **Server-Side Pre-rendering:** Data is fetched by the server and embedded directly into the HTML or into a `<script type="application/json" id="initial-state">` tag. Nexus UX then merges this data into its signals during hydration.
        ```html
        <!-- Server-rendered HTML snippet -->
        <script type="application/json" id="initial-state">
            { "user": { "id": 123, "name": "John Doe", "email": "john.doe@example.com" } }
        </script>
        <!-- Client-side script to hydrate -->
        <script type="module">
            import { signals } from 'datastar'; // Assuming signals are exposed
            const initialStateEl = document.getElementById('initial-state');
            if (initialStateEl) {
                const initialState = JSON.parse(initialStateEl.textContent);
                signals.merge(initialState, true); // Merge only if missing
            }
        </script>
        ```
    *   **Client-Side Updates (Post-Hydration):** For data that changes frequently or is user-specific and not part of the initial server render, components can use `data-on-load`, `data-on-click`, or other Nexus UX actions to fetch updates from the server, similar to CSR.
        ```html
        <!-- In a hydrated component -->
        <button data-on-click="@post('/api/refresh-user-data', { mergeSignals: true })">Refresh Data</button>
        <p>Last updated: <span data-text="$user.lastUpdated"></span></p>
        ```

##### C. Traditional Islands Routing (New Section)

In this approach (popularized by frameworks like Astro), each route is a self-contained, full HTML document, often referred to as an "Island." These Islands include their own layout, content, and interactive components. When navigating, the router's role is to load and display these *entire HTML documents*, effectively replacing the current page with a new one. This is similar to traditional server-side navigation but can be enhanced with client-side prefetching and transitions. **Layouts, if used, are statically defined within the Island's HTML markup.**

**Implementation Details:**

1.  **File System as Route Definition:** Each HTML file under the `site/` directory represents a full Island.
    *   `site/index.html` -> `/` (Full HTML document for the home page)
    *   `site/about.html` -> `/about` (Full HTML document for the about page)
    *   `site/users/[id].html` -> `/users/:id` (Full HTML document for a user profile)

2.  **Router Initialization (on page load):**
    *   The Nexus UX engine loads and initializes all plugins, including the `Router` Watcher Plugin.
    *   The `Router` Watcher Plugin's `onGlobalInit` method:
        *   Establishes conventions for mapping URL paths to static HTML file paths (e.g., `/users/123` will attempt to fetch `site/users/[id].html`). The router will dynamically resolve the appropriate Island URL based on the current `window.location.pathname` and these conventions. The success or failure of fetching these files implicitly defines the valid routes.
        *   Performs an initial route resolution based on `window.location.pathname`.
        *   Updates `$router.path`, `$router.params`, etc., signals.
        *   **Sets the `$router.currentPageComponentUrl` signal** to the URL of the resolved Island (e.g., `/about.html` or `/users/[id].html`).
        *   The primary router outlet, `<router-outlet>`, in `index.html` will be bound to `$router.currentPageComponentUrl`. This outlet will load the *entire HTML document* for the Island.

    ```html
    <!-- site/index.html (Full Island for the home page, with an optional static layout) -->
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Home Island</title>
        <script type="module" src="/path/to/datastar.js"></script>
        <script type="module">
            import { load, apply, setAlias } from '/path/to/datastar.js';
            // Assuming Router and other plugins are loaded here
            // load(Router, ...);
            // apply();
            // setAlias('ds');
        </script>
    </head>
    <body>
        <header><h1>Home Island Header</h1></header>
        <nav>
            <a href="/" data-on-click="@router.navigate('/')">Home</a>
            <a href="/about" data-on-click="@router.navigate('/about')">About</a>
            <a href="/users/123" data-on-click="@router.navigate('/users/123')">User 123</a>
        </nav>
        <main>
            <h1>Welcome to the Home Island!</h1>
            <p>This is the content for the home page.</p>
        </main>
        <footer><p>&copy; 2025 Home Island</p></footer>
    </body>
    </html>
    ```

    ```html
    <!-- site/about.html (Full Island for the about page, with an optional static layout) -->
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>About Island</title>
        <script type="module" src="/path/to/datastar.js"></script>
        <script type="module">
            import { load, apply, setAlias } from '/path/to/datastar.js';
            // Assuming Router and other plugins are loaded here
            // load(Router, ...);
            // apply();
            // setAlias('ds');
        </script>
    </head>
    <body>
        <header><h1>About Island Header</h1></header>
        <nav>
            <a href="/" data-on-click="@router.navigate('/')">Home</a>
            <a href="/about" data-on-click="@router.navigate('/about')">About</a>
            <a href="/users/123" data-on-click="@router.navigate('/users/123')">User 123</a>
        </nav>
        <main>
            <h1>About Us</h1>
            <p>This is the content for the about page.</p>
        </main>
        <footer><p>&copy; 2025 About Island</p></footer>
    </body>
    </html>
    ```

3.  **Navigation (Client-Side):**
    *   **Declarative (Link Clicks):** `data-on-click="@router.navigate('/path')"` is used. The router intercepts the click, resolves the path to the full Island HTML file, and updates the `$router.currentPageComponentUrl` signal. `component.ts` then fetches and injects this *entire HTML document* into the primary `<router-outlet>`, effectively replacing the current page content.
    *   **Imperative (Programmatic):** `window.$router.navigate('/new-path')` is used for programmatic control.

4.  **Content Injection and Reactivity:** `component.ts` fetches the full Island HTML document. This document, containing its own `data-*` attributes, is then injected into the primary `<router-outlet>`. Nexus UX automatically processes these attributes, making the newly loaded Island immediately reactive and interactive.

5.  **Data Fetching Workflow:**
    In Traditional Islands Routing, each Island is a self-contained HTML document, meaning data is typically fetched and embedded on the server-side before the Island is delivered. Client-side data fetching within an Island follows standard Nexus UX patterns:
    *   **Server-Side Pre-rendering:** The server is responsible for fetching all necessary data for a given Island and embedding it directly into the HTML or as JSON within a script tag. This ensures the Island is fully formed and ready for hydration upon delivery.
        ```html
        <!-- site/users/[id].html (Island example) -->
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <!-- ... head content ... -->
        </head>
        <body>
            <main>
                <h1>User Profile for <span data-text="$user.name"></span></h1>
                <p>Email: <span data-text="$user.email"></span></p>
                <!-- ... other content ... -->
            </main>
            <script type="application/json" id="user-data">
                { "user": { "id": 123, "name": "John Doe", "email": "john.doe@example.com" } }
            </script>
            <script type="module">
                import { signals } from 'datastar';
                const userData = JSON.parse(document.getElementById('user-data').textContent);
                signals.merge(userData); // Merge into global signals
            </script>
        </body>
        </html>
        ```
    *   **Client-Side Updates:** For dynamic updates within an Island (e.g., fetching more data, submitting forms), standard Nexus UX backend actions (`@get`, `@post`, etc.) can be used. These actions will update signals, which in turn reactively update the DOM.
        ```html
        <!-- Within the user profile Island -->
        <button data-on-click="@get('/api/user-posts/' + $user.id, { mergeSignals: true })">Load Posts</button>
        <div data-each="$post in $userPosts">
            <p data-text="$post.title"></p>
        </div>
        ```

##### D. Content Fragment Routing (Preferred Approach - Major Revision)

This approach focuses on loading only the necessary content fragments into a designated router outlet, allowing for highly dynamic and performant updates without full page reloads. **Fragments are pure content:** they are HTML snippets concerned only with content; they explicitly do not contain layout details. **Layouts are optional and can be implemented either statically or dynamically.**

**Implementation Details:**

1.  **File System as Route Definition:** The physical file structure under the `site/` directory defines the application's routes. The Nexus UX router dynamically infers these routes at runtime based on established conventions.
    *   `site/index.html` -> `/`
    *   `site/about.html` -> `/about` (A pure content fragment)
    *   `site/users/[id].html` -> `/users/:id` (A pure content fragment)
    *   `site/blog/[...slug].html` -> `/blog/*` (A pure content fragment)
    *   `site/_layouts/main-layout.html` -> A **Layout Component**, not directly routable as a content fragment.
    *   `site/_components/user-card.html` -> A reusable component, not directly routable.

2.  **Router Initialization (on page load):**
    *   The Nexus UX engine loads and initializes all plugins, including the `Router` Watcher Plugin.
    *   The `Router` Watcher Plugin's `onGlobalInit` method:
        *   Establishes conventions for mapping URL paths to static HTML file paths (e.g., `/users/123` will attempt to fetch `site/users/[id].html`). The router will dynamically resolve the appropriate content fragment URL based on the current `window.location.pathname` and these conventions. The success or failure of fetching these files implicitly defines the valid routes.
        *   Identifies the primary router outlet(s) in the DOM. This can be either a `<router-outlet>` for static layouts, or a `<main-layout>` for dynamic layouts.
        *   Performs an initial route resolution based on `window.location.pathname`.
        *   Updates `$router.path`, `$router.params`, etc., signals.
        *   **Sets the `$router.currentLayoutComponentUrl` signal** to the URL of the resolved **Layout Component** (e.g., `/_layouts/main-layout.html`) if a dynamic layout is used. If the layout is static (defined directly in `index.html`), this signal can remain `null` or be set to an empty string.
        *   **Sets the `$router.currentPageComponentUrl` signal** to the URL of the resolved **Content Fragment** (e.g., `/about.html` or `/users/[id].html`).
        *   The primary layout outlet (if dynamic) or the content outlet (if static layout) will then be observed by `component.ts`. `component.ts` will fetch the respective HTML, parse its `<template>`, and inject the content. This injection *is* the initial content activation, immediately becoming reactive.

    **Flexible Router Outlet Placement & Layout Scenarios:**

    **Scenario 1: No Explicit Layout (Implicit Static Layout)**
    The `<router-outlet>` is placed directly in `index.html`. Any surrounding HTML in `index.html` acts as an implicit static layout. The router injects content fragments into this `<router-outlet>`.
    ```html
    <!-- site/index.html -->
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>No Explicit Layout App</title>
        <script type="module" src="/path/to/datastar.js"></script>
        <script type="module">
            import { load, apply, setAlias } from '/path/to/datastar.js';
            // Assuming Router and other plugins are loaded here
            // load(Router, ...);
            // apply();
            // setAlias('ds');
        </script>
    </head>
    <body>
        <header><h1>My App Header (Implicit Layout)</h1></header>
        <nav>
            <a href="/" data-on-click="@router.navigate('/')">Home</a>
            <a href="/about" data-on-click="@router.navigate('/about')">About</a>
        </nav>
        <main>
            <!-- The primary router outlet for content fragments -->
            <router-outlet data-component="$router.currentPageComponentUrl"></router-outlet>
        </main>
        <footer><p>&copy; 2025 No Explicit Layout App</p></footer>
    </body>
    </html>
    ```

    **Scenario 2: Static Layout Component**
    A `<main-layout>` custom element is placed in `index.html` with a static URL in its `data-component` (e.g., `<main-layout data-component="/_layouts/my-fixed-layout.html">`). This loaded Layout Component can contain the `<router-outlet>` for content fragments, but its placement is flexible.
    ```html
    <!-- site/index.html -->
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Static Layout Component App</title>
        <script type="module" src="/path/to/datastar.js"></script>
        <script type="module">
            import { load, apply, setAlias } from '/path/to/datastar.js';
            // Assuming Router and other plugins are loaded here
            // load(Router, ...);
            // apply();
            // setAlias('ds');
        </script>
    </head>
    <body>
        <!-- Primary layout custom element with static data-component -->
        <main-layout data-component="/_layouts/app-main-layout.html">
            <!-- The <main-layout> component will load its content, which includes a <router-outlet> -->
        </main-layout>
    </body>
    </html>
    ```

    ```html
    <!-- site/_layouts/app-main-layout.html (A Layout Component) -->
    <template>
        <header><h1>My Static App Header</h1></header>
        <nav>
            <a href="/" data-on-click="@router.navigate('/')">Home</a>
            <a href="/about" data-on-click="@router.navigate('/about')">About</a>
            <a href="/users/123" data-on-click="@router.navigate('/users/123')">User 123</a>
        </nav>
        <main>
            <!-- Nested router outlet for content fragments -->
            <router-outlet data-component="$router.currentPageComponentUrl"></router-outlet>
        </main>
        <footer><p>&copy; 2025 Static Layout App</p></footer>
    </template>
    ```

    **Scenario 3: Dynamic Layout Component**
    A `<main-layout>` custom element is placed in `index.html` with a dynamic signal (`$router.currentLayoutComponentUrl`) in its `data-component` (e.g., `<main-layout data-component="$router.currentLayoutComponentUrl">`). The router can dynamically change this layout. The loaded Layout Component can contain the `<router-outlet>` for content fragments, but its placement is flexible.
    ```html
    <!-- site/index.html -->
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dynamic Layout Component App</title>
        <script type="module" src="/path/to/datastar.js"></script>
        <script type="module">
            import { load, apply, setAlias } from '/path/to/datastar.js';
            // Assuming Router and other plugins are loaded here
            // load(Router, ...);
            // apply();
            // setAlias('ds');
        </script>
    </head>
    <body>
        <!-- Primary layout custom element with dynamic data-component -->
        <main-layout data-component="$router.currentLayoutComponentUrl"></main-layout>
    </body>
    </html>
    ```

    ```html
    <!-- site/_layouts/main-layout.html (A Layout Component) -->
    <template>
        <header><h1>My Dynamic App Header</h1></header>
        <nav>
            <a href="/" data-on-click="@router.navigate('/')">Home</a>
            <a href="/about" data-on-click="@router.navigate('/about')">About</a>
            <a href="/users/123" data-on-click="@router.navigate('/users/123')">User 123</a>
        </nav>
        <main>
            <!-- Nested router outlet for content fragments -->
            <router-outlet data-component="$router.currentPageComponentUrl"></router-outlet>
        </main>
        <footer><p>&copy; 2025 Dynamic Layout App</p></footer>
    </template>
    ```

    ```html
    <!-- site/about.html (A pure content fragment) -->
    <template>
        <h2>About Us</h2>
        <p>This is the about page content.</p>
    </template>
    ```

    ```html
    <!-- site/users/[id].html (A pure content fragment) -->
    <template>
        <h2>User Profile</h2>
        <p>User ID: <span data-text="$props.id"></span></p>
        <!-- $props.id is automatically passed from $router.params.id -->
    </template>
    ```

    **Reiterate that no build step is required; the static site's file system serves as the dynamic route discovery.**

3.  **Navigation (Client-Side):**
    *   **Declarative (Link Clicks):** `data-on-click="@router.navigate('/path')"` is used. The router intercepts the click, resolves the path against its file-system-derived conventions, and updates the appropriate signals (`$router.currentLayoutComponentUrl` if the layout changes, and `$router.currentPageComponentUrl`).
    *   **Imperative (Programmatic):** `window.$router.navigate('/new-path')` is used for programmatic control.

4.  **Content Injection and Reactivity:** `component.ts` fetches the HTML for the resolved Layout Component (if dynamic) and/or the Content Fragment. These HTML files, containing their own `data-*` attributes, are then injected into the respective router outlets. Nexus UX automatically processes these attributes, making the newly loaded content immediately reactive and interactive.

5.  **Data Fetching Workflow:**
    In Content Fragment Routing, data fetching is highly flexible and can occur at various stages, leveraging Nexus UX's declarative backend actions:
    *   **Route Guards (`data-route:handler`):** For data required before the content fragment is even loaded, or for authentication/authorization checks. This ensures data is available in signals before the component attempts to render.
        ```html
        <!-- In a route template (e.g., <template data-route="/dashboard" data-route:handler="fetchDashboardData"></template>) -->
        <script>
            async function fetchDashboardData(ctx) {
                ctx.signals.setValue('$router.loading', true);
                try {
                    const response = await fetch('/api/dashboard-summary');
                    if (!response.ok) throw new Error('Failed to fetch dashboard data');
                    const data = await response.json();
                    ctx.signals.merge({ dashboard: data });
                    return true; // Allow navigation
                } catch (error) {
                    ctx.signals.setValue('$router.error', 'Dashboard data error: ' + error.message);
                    return false; // Prevent navigation
                } finally {
                    ctx.signals.setValue('$router.loading', false);
                }
            }
        </script>
        ```
    *   **`data-on-load` within Content Fragments:** For data specific to the content fragment that can be fetched once the fragment is loaded into the DOM.
        ```html
        <!-- In a content fragment (e.g., site/products/[id].html) -->
        <template>
            <div data-on-load="@get('/api/products/' + $router.params.id, { mergeSignals: true })">
                <h2>Product: <span data-text="$product.name"></span></h2>
                <p>Price: <span data-text="$product.price"></span></p>
            </div>
        </template>
        ```
    *   **`data-on-signal-change`:** For data that needs to reactively update based on changes to router parameters or other signals within the fragment.
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

#### IV. Key Interactions and Flow (Common to all paradigms, with specific nuances)

1.  **Router Initialization (on page load):**
    *   The Nexus UX engine loads and initializes all plugins, including the `Router` Watcher Plugin.
    *   The `Router` Watcher Plugin's `onGlobalInit` method:
        *   **Route Discovery:** (Specific to paradigm)
            *   **CSR:** Loads client-side defined route configurations.
            *   **SSR:** Primarily focuses on hydrating existing DOM.
            *   **Traditional Islands:** Dynamically infers routes from the static site's file structure based on established conventions (e.g., `/users/123` maps to `site/users/[id].html`). No explicit manifest is loaded.
            *   **Content Fragment Routing:** Dynamically infers routes from the static site's file structure based on established conventions (e.g., `/users/123` maps to `site/users/[id].html`). No explicit manifest is loaded.
        *   Identifies the primary router outlet(s) in the DOM (e.g., `<router-outlet>` for CSR/Traditional Islands/Static Content Fragment Layouts, or `<main-layout>` for Dynamic Content Fragment Layouts).
        *   Performs an initial route resolution based on `window.location.pathname` (or `hash` if configured). This includes **watching and intercepting direct address bar URL entries** for static files.
            *   **Error Handling and Recovery:** The router provides robust error handling mechanisms. If a navigation fails due to various reasons (e.g., route not found, network issues, errors in route guards, or component loading failures), the `$router.error` signal will be updated with relevant error information. For a `route not found` error, the router will automatically trigger a navigation to a special route, e.g., a static file like `site/404.html`. The `404.html` content will then be loaded into the custom element. Developers can subscribe to the `$router.error` signal to implement custom error displays or recovery logic.
        *   Updates `$router.path`, `$router.params`, etc., signals.
        *   **Sets the `$router.currentLayoutComponentUrl` signal** (if applicable for Content Fragment Routing with dynamic layouts) and **sets the `$router.currentPageComponentUrl` signal** to the URL (or ID for inline templates) of the resolved content.
        *   The custom element(s) with `data-component` attributes will then be observed by `component.ts`. `component.ts` will fetch (if not already present from SSR), parse, inject, and activate Nexus UX on the content. This layered injection *is* the initial content activation, immediately becoming reactive due to Nexus UX's core capabilities.

2.  **Client-Side Navigation (Link Clicks):** (Applies to CSR, Traditional Islands, and Content Fragment Routing)
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
        *   Updates browser history using `history.pushState()` (or `replaceState()` for redirects).
        *   Updates `$router.path`, `$router.params`, etc., signals.
        *   **Sets the `$router.currentLayoutComponentUrl` signal** (if applicable for Content Fragment Routing with dynamic layouts) and **sets the `$router.currentPageComponentUrl` signal** to the URL (or ID) of the new content.
        *   `component.ts` takes over: fetches the static HTML file, parses, injects, and activates Nexus UX on the new content. This newly injected content becomes the active content, immediately becoming interactive through its declarative attributes.
        *   **Route Transition Hooks (After Enter):** After successful content loading and activation, execute `data-route:after-enter` handlers for the new route.
        *   Sets `$router.loading = false`.
        *   **Route Transition Hooks (After Leave):** After the current route's content has been removed/deactivated, execute `data-route:after-leave` handlers for the previous (left) route. These can leverage `component.ts`'s `disconnectedCallback` for cleanup.

3.  **Programmatic Navigation:**
    *   Developers call `window.$router.navigate('/new-path')` (or similar API exposed by the router).
    *   This directly invokes the `navigate()` flow described above, leading to the loading and activation of the target content.

4.  **Browser Back/Forward Buttons:** (Applies to CSR, Traditional Islands, and Content Fragment Routing)
    *   The browser dispatches a `popstate` event.
    *   The Router core listens for `popstate`.
    *   It resolves the route based on the new `window.location`.
    *   It then triggers the content loading process by **setting the `$router.currentLayoutComponentUrl` signal** (if applicable for Content Fragment Routing with dynamic layouts) and **setting the `$router.currentPageComponentUrl` signal**, similar to a programmatic navigation, but without pushing a new history entry. This also results in the loading and activation of the appropriate content.
    *   **Scroll Restoration:** The router will automatically restore the scroll position to the state saved in `history.state` for the previous entry, or to the top of the page if no saved position is found.

#### IV. `data-component` Flexibility (New Detailed Section)

A dedicated subsection will be added to explain the various data types the `data-component` attribute can accept, and how each adds value to the routing solution:

*   **Static URLs:** (e.g., "/pages/about.html")
*   **URLs with Fragment Identifiers:** (e.g., "/shared/templates.html#my-section")
*   **Inline Template ID References:** (e.g., "#my-inline-template")
*   **Inline Template Strings:** (e.g., "<template><h1>Hello!</h1></template>")
*   **Data URLs:** (e.g., "data:text/html;base64,...")
*   **Dynamic Signals:** (e.g., "$router.currentPageComponentUrl", "$router.currentLayoutComponentUrl")

#### V. Leveraging Nexus UX Plugins (Detailed Integration)

This section details how existing Nexus UX plugins will be directly utilized or adapted for the router:

1.  **`Signals` (`data-signals-*`) & `Computed` (`data-computed-*`)**:
    *   **Router State:** The core router module will manage its state (`$router.path`, `$router.params`, `$router.loading`, `$router.error`, `$router.currentLayoutComponentUrl`, `$router.currentPageComponentUrl`, etc.) as Nexus UX signals. These will be accessible globally (e.g., `signals.signal('$router.path').value`).
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
    *   **Central Role:** This plugin is the *sole* mechanism for loading content into the designated custom elements. The router's job is to update the `$router.currentPageComponentUrl` signal, which the custom elements' `data-component` attributes are bound to.
    *   **Reactive Properties to Components:** Route parameters (`$router.params`) will be automatically passed as reactive properties to the loaded `NexusUXComponent` instances. For example, if the route is `/users/:id`, the `UserComponent` loaded into the custom element will receive `$props.id` as a signal.
    *   **Component Lifecycle:** The `connectedCallback` and `disconnectedCallback` of `NexusUXComponent` will be used for component-specific setup and cleanup, ensuring proper resource management during route changes.
    *   **Component-Level Error Handling:** While `component.ts` itself does not contain error boundaries, component-level rendering errors can be managed by implementing `try-catch` logic in the utility that updates the `data-component`'s source signal (e.g., `$router.currentPageComponentUrl`). If an error occurs during data fetching or processing *before* the signal is updated, the `$router.error` signal can be set, and a fallback component (e.g., an error message component) can be loaded by updating the `data-component` signal with an error-specific source.

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
    *   **Route Guard Data:** Route handlers (guards) can fetch data and then use `signals.merge()` to make that data available as global signals before the component renders.
    *   **Cleanup:** When navigating away from a route, the router can trigger `signals.remove()` for signals specifically associated with the previous route, preventing memory leaks and stale data. This could be part of a `data-route:cleanup` handler.

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

#### VI. File System Structure & Conventions

To maintain clarity and consistency for routing, the following file structure conventions will be adopted:

*   **`src/plugins/official/core/watchers/router.ts`**: Contains the main `Router` core logic.
*   **`src/plugins/official/core/attributes/route.ts`**: Implements the `data-route` attribute plugin.
*   **`src/plugins/official/core/watchers/history.ts`**: Provides history management utilities.
*   **`site/`**: This directory will contain all the static HTML files that define the application's routes and components.
    *   **`site/index.html` (or `site/index.htm`):** This will serve as the application's entry point and the default route (`/`). It will contain the primary router outlet, `<router-outlet>`, whose `data-component` attribute is bound to `$router.currentPageComponentUrl`.
    *   **`site/_components/`**: This directory will house reusable HTML fragments or custom elements. These are not directly routable.
        *   Example: `site/_components/user-card.html`, `site/_components/navigation-bar.html`.
    *   **`site/_layouts/`**: This directory will contain HTML files defining **Layout Components**. These are not directly routable by the router, but are intended to be loaded as components (e.g., into a `<main-layout>` custom element) and provide structural consistency. A layout component may contain a `<router-outlet>` for content fragments if desired.
        *   Example: `site/_layouts/main-layout.html`.        
    *   **All other HTML files and directories/subdirectories within `site/` (excluding `_components/` and `_layouts/`) will serve as routable content.
        *   For **Traditional Islands Routing**, these files are full HTML documents (Islands).
        *   For **Content Fragment Routing**, these files are pure content fragments.
        *   Example:
            *   `site/about.html` -> `/about`
            *   `site/users/[id].html` -> `/users/:id` (dynamic segment, where `[id]` is a placeholder for a parameter)
            *   `site/blog/[...slug].html` -> `/blog/*` (catch-all segment)
            *   `site/404.html` -> `/404` (for error handling)

#### VIII. Technical Implementation Steps

This section outlines the detailed technical steps required to implement the Nexus UX Multiparadigm Router. Each step is designed to be a self-contained task, building upon previous functionality.

**Phase 1: Core Utilities and Signal Setup**

1.  **Create Router-Specific Files:**
    *   Create `src/plugins/official/core/watchers/router.ts`.
    *   Create `src/plugins/official/core/attributes/route.ts`.
    *   Create `src/plugins/official/core/watchers/history.ts`.

2.  **Implement `history.ts` Utilities:**
    *   In `src/plugins/official/core/watchers/history.ts`:
        *   Define and export `pushState(url: string, data?: any)`: A wrapper around `window.history.pushState`.
        *   Define and export `replaceState(url: string, data?: any)`: A wrapper around `window.history.replaceState`.
        *   Implement a `popstate` event listener that dispatches a custom event (e.g., `router:popstate`) with the new URL. This event will be consumed by the `router.ts` module.

3.  **Define Core Router Signals:**
    *   In `src/plugins/official/core/watchers/router.ts`:
        *   Initialize the following Nexus UX signals within the `Router` module's scope (e.g., in its `onGlobalInit` method or as module-level signals):
            *   `$router.path`: `signal('')`
            *   `$router.params`: `signal({})`
            *   `$router.query`: `signal({})`
            *   `$router.hash`: `signal('')`
            *   `$router.loading`: `signal(false)`
            *   `$router.error`: `signal(null)`
            *   `$router.previousPath`: `signal('')`
            *   `$router.currentLayoutComponentUrl`: `signal(null)`
            *   `$router.currentPageComponentUrl`: `signal(null)`
            *   `$router.currentNestedComponentUrl`: `signal(null)`

**Phase 2: `Router` Core Module Implementation (`router.ts`)**

1.  **Basic `Router` Watcher Plugin Structure:**
    *   Define `Router` as a `WatcherPlugin` in `src/plugins/official/core/watchers/router.ts`.
    *   Implement its `onGlobalInit` method.

2.  **Initial Page Load Handling:**
    *   Inside `Router.onGlobalInit`:
        *   Attach a listener for the `router:popstate` event (from `history.ts`).
        *   Implement `resolveAndLoadRoute(url: string)` function:
            *   This function will be the central point for processing a new URL.
            *   It should parse the URL, extract path, query, and hash.
            *   It should update `$router.path`, `$router.query`, `$router.hash` signals.
            *   It should set `$router.loading.value = true`.
            *   It should call a route matching function (to be implemented later) to determine the target content URL.
            *   It should update `$router.currentLayoutComponentUrl` and `$router.currentPageComponentUrl` signals based on the matched route.
            *   Set `$router.loading.value = false` after content loading is initiated.
        *   Call `resolveAndLoadRoute(window.location.href)` to handle the initial page load.

3.  **Programmatic Navigation (`navigate()`):**
    *   Define and export a `navigate(url: string, options?: { replace?: boolean })` function within the `Router` module.
    *   This function should:
        *   Save the current scroll position to `history.state` before navigating.
        *   Update `$router.previousPath` with the current `$router.path.value`.
        *   Call `history.pushState()` or `history.replaceState()` based on `options.replace`.
        *   Call `resolveAndLoadRoute(url)`.

4.  **Route Matching Logic:**
    *   Implement a robust route matching algorithm within `router.ts` (or a helper utility). This algorithm should:
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
    *   Define `Route` as an `AttributePlugin` in `src/plugins/official/core/attributes/route.ts`.
    *   Implement its `onLoad` method.

2.  **Route Definition and Registration:**
    *   Inside `Route.onLoad(ctx)`:
        *   Access the `<template data-route>` element (`ctx.el`).
        *   Extract the route pattern (if explicitly provided, otherwise infer from file path conventions).
        *   Extract `data-route:handler` attribute value.
        *   Register this route with the `Router` core module (e.g., via a public method on the `Router` instance, or by updating a shared signal that the `Router` observes). This registration should include the pattern, the handler reference, and the component URL (which would be the `src` of the template or inferred from the file path).

3.  **Route Handler Execution and Transition Hooks:**
    *   In `router.ts`, when a route is matched and before content loading:
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
        *   Dynamic Signals (e.g., `"$router.currentPageComponentUrl"`)
    *   Ensure the `getTemplateHtml` and `parseComponentHTML` functions within `component.ts` correctly handle these variations.

2.  **Reactive Properties (`$props`):**
    *   Confirm that `component.ts` correctly passes route parameters (from `$router.params`) as reactive properties to the loaded `NexusUXComponent` instances via the `$props` signal. This involves mapping `$router.params.id` to `$props.id` within the component's scope, and also handles nested parameters (e.g., `$router.params.user.id` mapping to `$props.user.id`).

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

