# The Datastar Expedition: A Developer's Guide to a New Frontier

Welcome, adventurer, to Datastar. You've embarked on a journey to a place where web development is simpler, more powerful, and more intuitive. This guide is your map and compass, designed to navigate you through the Datastar ecosystem, revealing its core philosophies, powerful tools, and the secrets to mastering and extending its capabilities.

## The Quest Begins: Understanding the Datastar Philosophy

Every great journey starts with a "why." Datastar was born from a desire to reclaim the web's original power while embracing modern reactivity. Its philosophy is **Server-Driven Hypermedia with Client-Side Reactivity**.

*   **Server-Driven Hypermedia**: Your backend is the master storyteller. It controls the application logic, state, and flow. This is the time-tested power of the web, where each interaction leads to a new state defined by the server.
*   **Client-Side Reactivity**: Your frontend is a nimble and intelligent scout. It uses a fine-grained reactivity system (signals) to make the UI instantly responsive to user interactions, creating a rich user experience without the weight of a full Single-Page Application (SPA).

This dual approach solves the problem of overwhelming complexity. You write most of your logic in the backend language you already know. The frontend becomes a thin, declarative layer that brings your static HTML to life.

The core loop is an elegant dance between client and server:
1.  A user interacts with an element (e.g., clicks a button).
2.  Datastar sends a lightweight request to your backend.
3.  Your backend performs its logic and sends back a stream of simple instructions via Server-Sent Events (SSEs), like "merge this HTML" or "update this value."
4.  The Datastar frontend library receives these instructions and intelligently updates the page.

This keeps your frontend code minimal and your backend in control, making your applications a joy to build and maintain.

## The Lay of the Land: Core Architecture & Concepts

To navigate this new world, you must understand its three foundational pillars: the Engine, Signals, and the Plugin Architecture.

#### 1. The Engine: The Brains of the Operation
The file `/home/aerea/Nexus-UX/library/src/engine/engine.ts` is the heart of Datastar. It's a remarkably concise and readable file that orchestrates everything.

*   **Lifecycle Management**: The engine uses a `MutationObserver` to watch for changes to the DOM. When you add an element, it calls `applyToElement` to scan for `data-*` attributes and activate the corresponding plugins. When an element is removed, it automatically runs any cleanup functions registered by those plugins, preventing memory leaks.
*   **Safe Expression Evaluation (`genRX`)**: Datastar lets you write JavaScript-like expressions in your HTML. To do this safely, the `genRX` function acts as a mini-compiler. It parses the expression and replaces potentially unsafe code with secure, context-aware equivalents:
    *   `$mySignal` becomes `ctx.signals.signal('mySignal').value`
    *   `@myAction()` becomes `ctx.actions.myAction.fn(ctx)`
    This gives you the power of JavaScript without the security risks of `eval()`.

#### 2. Signals: The Lifeblood of Reactivity
Datastar's reactivity is powered by a vendored version of Preact Signals. A signal is a variable that, when its value changes, automatically notifies anything that depends on it.

*   **Namespacing**: You can organize your state cleanly using dot notation, like `$user.name` or `$form.email`.
*   **Local-Only State**: Any signal starting with an underscore (e.g., `_myLocalVar`) is considered private to the client. It will never be sent to the server in backend requests, as seen in the `/home/aerea/Nexus-UX/site/static/md/examples/signals_change.md` example. This is perfect for UI state that the server doesn't need to know about.

#### 3. The Plugin Architecture: The Building Blocks of the World
**Everything in Datastar is a plugin.** This is the most important architectural concept. It makes the framework incredibly modular and extensible. This architecture has a clear, two-tiered organization, found in `/home/aerea/Nexus-UX/library/src/plugins/official/`.

*   **Tier 1: Categories of Concern (The "What")**
    These are the top-level folders that group plugins by their purpose.
    *   `core/`: Foundational mechanics for state and control flow.
    *   `dom/`: Direct DOM interaction and manipulation.
    *   `backend/`: All client-server communication.
    *   `browser/`: Integration with browser APIs (Clipboard, Storage, etc.).
    *   `logic/`: General-purpose utility functions.

*   **Tier 2: Implementation Types (The "How")**
    Within each category, plugins are sorted by their technical type, which defines how they integrate with the engine.
    *   **`attributes/`**: These plugins activate when a specific `data-*` attribute is found on an element. They are the primary way to create declarative behavior.
    *   **`actions/`**: These plugins define reusable `@` functions that can be called from any Datastar expression.
    *   **`watchers/`**: These plugins listen for global events (especially SSEs) and perform application-wide actions.

## The Arsenal: A Deep Dive into Datastar's Plugins

Now that you understand the architecture, let's explore the tools at your disposal. This is the complete set of officially maintained plugins that give Datastar its power, each with a practical example of its use.

---
#### `core/`
*   ##### `attributes/`
    *   **`computed.ts`**: Creates a read-only signal whose value is derived from other signals.
        ```html
        <div data-signals-firstName="'John'" data-signals-lastName="'Doe'">
          <!-- Creates a `fullName` signal that reactively updates -->
          <div data-computed:fullName="$firstName + ' ' + $lastName">
            <p data-text="$fullName"></p> <!-- Displays "John Doe" -->
          </div>
        </div>
        ```
    *   **`signals.ts`**: The primary plugin for initializing or merging signal values into the reactive system.
        ```html
        <!-- Initialize multiple signals using object syntax -->
        <div data-signals="{ user: { name: 'Alice', id: 123 }, app: { theme: 'dark' } }"></div>
        ```
    *   **`star.ts`**: A special internal plugin that orchestrates the processing of all other `data-*` attributes on an element. It is the engine that drives other attribute plugins and is not used directly by developers.

---
#### `dom/`
*   ##### `attributes/`
    *   **`attr.ts`**: Reactively sets or removes any HTML attribute on an element based on an expression.
        ```html
        <!-- The button is disabled if `isSubmitting` is true -->
        <button data-attr:disabled="$isSubmitting">Submit</button>
        ```
    *   **`bind.ts`**: Provides two-way data binding for form elements, synchronizing their value with a signal.
        ```html
        <input type="text" data-bind="form.username" placeholder="Enter username">
        <p>You typed: <span data-text="$form.username"></span></p>
        ```
    *   **`class.ts`**: Reactively adds or removes CSS classes based on the result of an expression.
        ```html
        <!-- Adds the 'active' class if `isActive` is true -->
        <div data-class:active="$isActive"></div>
        ```
    *   **`on.ts`**: Attaches event listeners to elements, with powerful modifiers for controlling event behavior.
        ```html
        <!-- Simple click handler -->
        <button data-on-click="$counter++">Increment</button>
        <!-- Prevents form submission and calls an action -->
        <form data-on-submit.prevent="@post('/api/form', $form)"></form>
        ```
    *   **`ref.ts`**: Stores a direct reference to the DOM element itself in a signal.
        ```html
        <div data-ref="myDivElement">I'm a div</div>
        <button data-on-click="$myDivElement.style.color = 'red'">Make me red</button>
        ```
    *   **`show.ts`**: Toggles the visibility of an element by setting its `display` style to `none`.
        ```html
        <div data-show="$isLoggedIn">Welcome back!</div>
        ```
    *   **`text.ts`**: Sets the `textContent` of an element based on the result of an expression.
        ```html
        <p>Welcome, <span data-text="$user.name"></span>!</p>
        ```

---
#### `backend/`
*   ##### `attributes/`
    *   **`indicator.ts`**: Creates signals that indicate when SSE requests are in flight, allowing you to show/hide loading indicators.
        ```html
        <button data-on-click="@get('/api/data')" data-indicator="isFetching">
          Fetch Data
        </button>
        <!-- This loading spinner will only be visible during the fetch -->
        <div data-show="$isFetching" class="loading-spinner"></div>
        ```
*   ##### `actions/`
    *   **`delete.ts`**, **`get.ts`**, **`patch.ts`**, **`post.ts`**, **`put.ts`**: A suite of actions that perform the corresponding HTTP request and handle the resulting SSE stream from the server.
        ```html
        <!-- Send a GET request when the element loads -->
        <div data-on-load="@get('/api/initial-data')"></div>
        <!-- Send a POST request with signal data on click -->
        <button data-on-click="@post('/api/users', { name: $newName })">
          Create User
        </button>
        ```
    *   **`sse.ts`**: The underlying core function that manages the SSE connection. It is used internally by the other backend actions and is not typically called directly.
*   ##### `watchers/`
    These plugins listen for specific SSE events from the backend. The usage is on the backend, which sends a specially formatted event stream.
    *   **`executeScript.ts`**: Executes JavaScript received via an SSE event.
        *   **Backend Usage (e.g., in Go):**
            ```go
            // sse is a *datastar.ServerSentEventGenerator
            sse.ExecuteScript("console.log('Hello from the server!');")
            ```
    *   **`mergeFragments.ts`**: Merges HTML fragments received via SSE into the DOM.
        *   **Backend Usage (e.g., in Go):**
            ```go
            // sse is a *datastar.ServerSentEventGenerator
            html := "<div id='profile'>Updated Profile</div>"
            sse.MergeFragments(html, datastar.WithSelectorID("profile"), datastar.WithMergeMorph())
            ```
    *   **`mergeSignals.ts`**: Merges signal values received via SSE into the client-side state.
        *   **Backend Usage (e.g., in Go):**
            ```go
            // sse is a *datastar.ServerSentEventGenerator
            sse.MergeSignals(datastar.NestedValues{"user.name": "Jane Doe"})
            ```
    *   **`removeFragments.ts`**: Removes DOM elements identified by a selector.
        *   **Backend Usage (e.g., in Go):**
            ```go
            // sse is a *datastar.ServerSentEventGenerator
            sse.RemoveFragments(datastar.WithSelector(".item-to-delete"))
            ```
    *   **`removeSignals.ts`**: Removes signals from the client-side state.
        *   **Backend Usage (e.g., in Go):**
            ```go
            // sse is a *datastar.ServerSentEventGenerator
            sse.RemoveSignals("user.tempToken", "form.password")
            ```

---
#### `browser/`
*   ##### `attributes/`
    *   **`component.ts`**: Defines a powerful HTML-first component model. It turns a custom element into a fully-featured component by loading a template from an external file or an inline string. The template content **must be encapsulated in a `<template>` tag**.
        It supports:
        - **Reactive Props**: Pass data in via `data-signals-*` attributes, accessible via `$props`.
        - **Lifecycle Hooks**: Use keys like `data-component:connected` and `data-component:disconnected`.
        - **DOM Encapsulation**: Use the native `shadowrootmode="open|closed"` attribute on the `<template>` tag for Declarative Shadow DOM.
        - **Form Integration**: Make components form-associated with the `data-component:formAssociated` key.
        - **Style Isolation**: Prevent global styles from being inherited by Shadow DOM components with `data-component:noGlobalStyles`.
        - **Error Handling**: Provide a graceful fallback with the `data-component:fallback` key.
        ```html
        <!-- Example: A form-associated user-card component -->
        <user-card
          data-component="/components/user-card.html"
          data-signals-username="'Alice'"
          data-component:formAssociated
          data-component:connected="console.log('User card for ' + $props.username + ' is ready.')"
          data-component:fallback="<template><p>Error loading card.</p></template>"
        ></user-card>

        <!-- /components/user-card.html -->
        <template shadowrootmode="open">
          <style>
            :host { display: block; border: 1px solid #ccc; padding: 1rem; }
          </style>
          <p>User: <span class="username" data-text="$props.username"></span></p>
        </template>
        ```
    *   **`customValidity.ts`**: Sets a custom validation message on a form element.
        ```html
        <input type="password" data-bind="password"
          data-custom-validity="$password.length < 8 ? 'Password must be at least 8 characters' : ''">
        ```
    *   **`onIntersect.ts`**: Executes an expression when an element intersects the viewport.
        ```html
        <!-- Lazy-load content when the div becomes visible -->
        <div data-on-intersect.once="@get('/api/lazy-content')">
          Loading...
        </div>
        ```
    *   **`onInterval.ts`**: Runs an expression repeatedly at a specified interval.
        ```html
        <!-- Increment a counter every second -->
        <div data-on-interval.duration.1s="$time++">
          Seconds elapsed: <span data-text="$time"></span>
        </div>
        ```
    *   **`onLoad.ts`**: Runs an expression once when the element is first processed.
        ```html
        <body data-on-load="@get('/api/session-data')">
          <!-- Page content -->
        </body>
        ```
    *   **`onRaf.ts`**: Runs an expression on every `requestAnimationFrame`, useful for smooth animations.
        ```html
        <div data-on-raf="updateAnimation()"></div>
        ```
    *   **`onSignalChange.ts`**: Executes an expression whenever a specific signal (or any signal) changes.
        ```html
        <!-- Log to console whenever the app.theme signal changes -->
        <div data-on-signal-change:app.theme="console.log('Theme changed to', $app.theme)"></div>
        ```
    *   **`persist.ts`**: Persists signal values to the browser's Local or Session Storage.
        ```html
        <!-- The `shoppingCart` signal will be saved to and loaded from session storage -->
        <div data-signals-shoppingCart="[]" data-persist.session="shoppingCart"></div>
        ```
    *   **`replaceUrl.ts`**: Replaces the current URL in the browser's history without a page reload.
        ```html
        <input data-bind="searchTerm"
          data-on-input.debounce.500ms="@replaceUrl('/search?q=' + $searchTerm)">
        ```
    *   **`scrollIntoView.ts`**: Scrolls the element into the viewport.
        ```html
        <div id="section-3" data-scroll-into-view.smooth.center>
          This will be centered on screen when it loads.
        </div>
        ```
    *   **`viewTransition.ts`**: Assigns a `view-transition-name` to an element to enable smooth transitions with the View Transitions API.
        ```html
        <div data-view-transition="user-card">...</div>
        ```
*   ##### `actions/`
    *   **`clipboard.ts`**: Copies a given text value to the user's clipboard.
        ```html
        <button data-on-click="@clipboard('Text to be copied!')">Copy</button>
        ```

---
#### `logic/`
*   ##### `actions/`
    *   **`fit.ts`**: Performs linear interpolation to clamp a value to a new range.
        ```html
        <!-- Scale a value from a 0-100 range to a 0-1 range for an opacity style -->
        <div data-attr:style="'opacity: ' + @fit($sliderValue, 0, 100, 0, 1)"></div>
        ```
    *   **`setAll.ts`**: Sets the value of multiple signals at once using a glob pattern.
        ```html
        <!-- Button to clear all inputs in a form -->
        <button data-on-click="@setAll('form.inputs.*', '')">Clear Form</button>
        ```
    *   **`toggleAll.ts`**: Toggles the boolean value of multiple signals at once using a glob pattern.
        ```html
        <!-- Button to select/deselect all items in a list -->
        <button data-on-click="@toggleAll('items.*.selected')">Toggle All</button>
        ```

---
## Allies on Your Journey: The Datastar SDKs

You are not alone on this expedition. To make your backend's job easy, Datastar provides official SDKs for many popular languages. These provide simple helper functions to generate the specific SSE event streams that the frontend understands, ensuring your backend is always speaking the correct "language."

Below are examples of sending a standard set of SSE events in each supported language.

*   **Clojure**
    ```clojure
    (let [sse (datastar/sse-generator response)]
      (datastar/merge-fragments sse "<div id='profile'>Updated</div>" {:selector "#profile"})
      (datastar/merge-signals sse {:user.name "Jane"})
      (datastar/execute-script sse "console.log('Success!')"))
    ```
*   **C# (.NET)**
    ```csharp
    var sse = new ServerSentEventGenerator(Response.Body);
    await sse.MergeFragmentsAsync("<div id='profile'>Updated</div>", new MergeFragmentOptions { Selector = "#profile" });
    await sse.MergeSignalsAsync(new { user = new { name = "Jane" } });
    await sse.ExecuteScriptAsync("console.log('Success!')");
    ```
*   **Go**
    ```go
    sse := datastar.NewServerSentEventGenerator(w)
    sse.MergeFragments("<div id='profile'>Updated</div>", datastar.WithSelectorID("profile"))
    sse.MergeSignals(datastar.NestedValues{"user.name": "Jane"})
    sse.ExecuteScript("console.log('Success!')")
    ```
*   **Haskell**
    ```haskell
    let sse = createSseGenerator handle
    mergeFragments sse "<div id='profile'>Updated</div>" [withSelector "#profile"]
    mergeSignals sse [("user.name", "Jane")]
    executeScript sse "console.log('Success!')"
    ```
*   **Java**
    ```java
    ServerSentEventGenerator sse = new ServerSentEventGenerator(response.getOutputStream());
    sse.mergeFragments("<div id='profile'>Updated</div>", new MergeFragmentOptions().setSelector("#profile"));
    sse.mergeSignals(Map.of("user.name", "Jane"));
    sse.executeScript("console.log('Success!')");
    ```
*   **PHP**
    ```php
    $sse = new ServerSentEventGenerator();
    $sse->mergeFragments("<div id='profile'>Updated</div>", ['selector' => '#profile']);
    $sse->mergeSignals(['user.name' => 'Jane']);
    $sse->executeScript("console.log('Success!')");
    $sse->send();
    ```
*   **Python**
    ```python
    sse = ServerSentEventGenerator()
    sse.merge_fragments("<div id='profile'>Updated</div>", selector="#profile")
    sse.merge_signals({"user.name": "Jane"})
    sse.execute_script("console.log('Success!')")
    return sse.render()
    ```
*   **Ruby**
    ```ruby
    sse = Datastar::ServerSentEventGenerator.new
    sse.merge_fragments("<div id='profile'>Updated</div>", selector: "#profile")
    sse.merge_signals("user.name" => "Jane")
    sse.execute_script("console.log('Success!')")
    render sse
    ```
*   **Rust**
    ```rust
    let mut sse = ServerSentEventGenerator::new();
    sse.merge_fragments("<div id='profile'>Updated</div>", Some("#profile"));
    sse.merge_signals(serde_json::json!({"user.name": "Jane"}));
    sse.execute_script("console.log('Success!')");
    sse.to_string()
    ```
*   **TypeScript**
    ```typescript
    const sse = new ServerSentEventGenerator();
    sse.mergeFragments("<div id='profile'>Updated</div>", { selector: "#profile" });
    sse.mergeSignals({ "user.name": "Jane" });
    sse.executeScript("console.log('Success!')");
    return sse.render();
    ```
*   **Zig**
    ```zig
    var sse = ServerSentEventGenerator.init(allocator);
    defer sse.deinit();
    try sse.mergeFragments("<div id='profile'>Updated</div>", .{ .selector = "#profile" });
    try sse.mergeSignals(&.{.key = "user.name", .value = "Jane"});
    try sse.executeScript("console.log('Success!')");
    ```

## The Forge: Building & Contributing to the Project

Datastar uses a robust, Go-based build system to ensure consistency, performance, and reliability. This moves beyond typical `npm` scripts into a more powerful and explicit toolchain, orchestrated by `Taskfile.yml` and a `Makefile` for Docker integration.

#### The Main Build Process
The primary goal of the build system is to compile the TypeScript source code from `/home/aerea/Nexus-UX/library/` into the final, distributable JavaScript files located in the top-level `/home/aerea/Nexus-UX/bundles/` directory.

This is handled by the `build` task, which runs a Go program (`/home/aerea/Nexus-UX/build/cmd/build/main.go`). This program uses the powerful `esbuild` library to bundle and minify the TypeScript source, creating the `datastar.js`, `datastar-core.js`, and other bundles.

There are two primary ways to run this build process: the recommended Docker approach for consistency, and the native local approach for those who prefer to manage their own environment.

#### Path 1: The Docker Approach (Recommended)
This is the easiest and most reliable way to get started. It uses Docker to create a self-contained development environment with all the necessary tools (Go, Node.js, etc.) pre-configured. You don't need to install any project dependencies on your local machine.

*   **Quick Start**:
    ```bash
    # Build the project and create the bundles/ directory
    make build

    # Start the development server for the site with live-reloading
    make dev
    ```
*   **How it Works**: The `Makefile` (`/home/aerea/Nexus-UX/Makefile.mk`) provides simple commands that run the `Taskfile.yml` tasks inside a consistent Docker container.
*   **Key Commands**:
    *   `make build`: Performs a full production build of the `datastar.js` bundles.
    *   `make dev`: Starts the documentation site on `http://localhost:8080` with hot-reloading for both frontend and backend changes.
    *   `make test`: Runs the Go test suite inside the container.
    *   `make ssh`: Opens a shell inside the development container for advanced debugging.
    *   `make clean`: Removes the Docker image and build artifacts for a completely fresh start.

#### Path 2: The Native Local Approach
If you prefer to manage your own toolchain, you can build the project natively.

*   **Prerequisites**: You will need to have the following installed on your system:
    *   Go
    *   Taskfile
    *   Node.js & pnpm (required for some dependency management and publishing tasks)

*   **Setup & Build**:
    ```bash
    # 1. Install necessary command-line tools (like the Tailwind CSS compiler)
    task tools

    # 2. Run the main build process
    task build
    ```
*   **How it Works**: This directly uses the `task` command-line tool to execute the steps defined in `/home/aerea/Nexus-UX/Taskfile.yml`. The `build` task will still run the same Go program to compile the TypeScript, but it will use the Go and Node versions installed on your local machine.
*   **Development Server**:
    ```bash
    # Build and run the site with hot-reloading
    task
    ```

#### Contributing to the Expedition
Contributions are welcome! The project values simplicity and adherence to its core hypermedia philosophy.

1.  **Discuss First**: Before writing any code, please open an issue on GitHub to discuss your idea or bug report. This ensures that your contribution aligns with the project's goals and avoids wasted effort.
2.  **Branch**: All pull requests must be made to the `develop` branch.
3.  **Be Descriptive**: Your pull request should have a descriptive title and a clear description of the problem and the solution.
4.  **Document**: If your change affects behavior, the documentation in `/home/aerea/Nexus-UX/site/static/md/` must be updated accordingly. Good documentation is as important as good code.
5.  **SDKs**: The bar for adding a new SDK is high. We only accept SDKs from developers who are willing to both contribute *and* maintain them. A new SDK pull request must include a README, documentation entries, code snippets, and a full implementation of all examples, as outlined in `CONTRIBUTING.md`.

## The Journey's End: A New Beginning

You have reached the end of this guide, but your adventure with Datastar is just beginning. You've explored its core philosophy of server-driven hypermedia, navigated its architecture of signals and plugins, and inventoried its powerful arsenal of tools and SDKs. You now possess the knowledge to not only use Datastar but to shape it, extend it, and contribute to its future.

The path forward is yours to forge. Build amazing things, simplify the complex, and rediscover the joy of web development. Thank you for embarking on this expedition. The world of hypermedia is vast and full of potential, and we're excited to see what you'll build in it.