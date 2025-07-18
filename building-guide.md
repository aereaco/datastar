### **Comprehensive Build Process Analysis for Nexus UX**

This repository utilizes a multi-faceted build system primarily orchestrated by `Makefile` (for Docker integration) and `Taskfile.yml` (for Go-based task management), alongside standard `package.json` scripts for JavaScript/TypeScript modules.

---

#### **1. Core Datastar.js Bundle Build**

This process compiles the main Datastar JavaScript library, including all plugins, into the final `datastar.js` and related bundle files.

*   **Orchestration:** `Taskfile.yml` (`build` task) -> `build/cmd/build/main.go` -> `build/run.go` (uses `esbuild`).
*   **Purpose:** To generate the production-ready JavaScript bundles (`datastar.js`, `datastar-core.js`, `datastar-aliased.js`) located in the top-level `bundles/` directory. These are the files consumed by web applications.
*   **Key Steps:**
    1.  **Go Template Compilation (`qtc`):** Compiles `.qtpl` (Go template) files into `.qtpl.go` Go source files. This is a dependency for the main Go build.
    2.  **ESBuild Execution:** A Go program (`build/cmd/build/main.go` which calls `build.Build()` in `build/run.go`) uses `esbuild` to bundle and minify the TypeScript source from `library/src/bundles/`.
    3.  **Bundle Copying:** The generated bundles are copied from a temporary location to the top-level `bundles/` directory, and also to `site/static/js/` and `library/dist/`.
    4.  **Constant Generation:** Various language-specific constant files (e.g., `consts.go`, `consts.ts`, `consts.py`) are updated with version and bundle size information.
*   **How to Execute:**
    *   **Recommended (via Docker):** This is the most reliable method as it ensures all Go and Node.js dependencies are correctly managed within a consistent environment.
        ```bash
        make build
        ```
    *   **Alternative (requires `task` CLI and Go installed locally):**
        ```bash
        task build
        ```
*   **Output:** Updated `.js` and `.js.map` files in `bundles/`, `site/static/js/`, and `library/dist/`. Updated constant files across various SDKs and `library/src/engine/consts.ts`.

---

#### **2. Site Build**

This process builds the Nexus UX documentation website.

*   **Orchestration:** `Taskfile.yml` (`site` task) -> `go build`
*   **Purpose:** To compile the Go web application for the `site/` directory, which serves the documentation and examples.
*   **Key Steps:**
    1.  **Dependencies:** Relies on the `support` task, which in turn runs `build` (for `datastar.js`), `templ` (for Go templates), and `css` (for Tailwind CSS).
    2.  **Go Application Compilation:** Compiles the Go source code for the site (`site/cmd/site/main.go`) into an executable.
*   **How to Execute:**
    *   **Recommended (via Docker):**
        ```bash
        make site
        ```
    *   **Alternative (requires `task` CLI, Go, and Node.js/pnpm installed locally):**
        ```bash
        task site
        ```
*   **Output:** An executable file (e.g., `./datastar-website` on Linux/macOS, `datastar-website.exe` on Windows) in the project root.

---

#### **3. Library (TypeScript) Build**

This specifically builds the TypeScript source code within the `library/` directory. This is a sub-step of the main `datastar.js` bundle build, but can be run independently.

*   **Orchestration:** `library/package.json` (`build` script) -> `tsc`
*   **Purpose:** To compile the TypeScript source files (`.ts`) in `library/src/` into JavaScript (`.js`) and generate TypeScript declaration files (`.d.ts`) in `library/dist/`. This is primarily for development and for publishing the `npm` package.
*   **How to Execute:**
    *   Navigate to the `library/` directory:
        ```bash
        cd library/
        pnpm install # Or npm install / yarn install if pnpm is not used
        pnpm build   # Or npm run build / yarn build
        ```
    *   **Note:** This step alone does *not* produce the final `datastar.js` bundles in the top-level `bundles/` directory. That is handled by the `task build` process.
*   **Output:** `.js` and `.d.ts` files in `library/dist/`.

---

#### **4. SDK TypeScript Build & Publish**

This process builds and publishes the TypeScript SDK.

*   **Orchestration:** `sdk/typescript/package.json` (`build` script) -> `deno run build.ts`
*   **Purpose:** To compile the TypeScript SDK for distribution via npm.
*   **Key Steps:**
    1.  **Deno Execution:** A Deno script (`sdk/typescript/build.ts`) is used to compile the TypeScript SDK.
    2.  **NPM Publish:** The compiled SDK is then published to npm.
*   **How to Execute:**
    *   **Recommended (via Docker):**
        ```bash
        make sdktspub
        ```
    *   **Alternative (requires `task` CLI and Deno installed locally):**
        ```bash
        task sdktspub
        ```
*   **Output:** Compiled TypeScript SDK in `sdk/typescript/npm/` and published to npm.

---

#### **5. CSS Build (Tailwind CSS)**

This process compiles the Tailwind CSS for the site.

*   **Orchestration:** `Taskfile.yml` (`css` task) -> `site/tailwindcli` (Tailwind CLI executable)
*   **Purpose:** To process the `site/src/css/site.css` (which uses Tailwind directives) and generate the final `site/static/css/site.css` file.
*   **Key Steps:**
    1.  **Tailwind CLI Download:** The `tools` task (a dependency) downloads the appropriate Tailwind CLI executable for the current platform.
    2.  **Tailwind Compilation:** The Tailwind CLI is executed to build the CSS.
*   **How to Execute:**
    *   **Recommended (via Docker):**
        ```bash
        make css
        ```
    *   **Alternative (requires `task` CLI and Node.js/pnpm installed locally):**
        ```bash
        task css
        ```
*   **Output:** `site/static/css/site.css`.

---

#### **6. Go Template Compilation (`qtc`)**

This process compiles Go template files.

*   **Orchestration:** `Taskfile.yml` (`qtc` task) -> `go tool qtc`
*   **Purpose:** To compile `.qtpl` files (Go templates) into `.qtpl.go` Go source files. This is a necessary step before building the main Datastar.js bundle or the site.
*   **How to Execute:**
    *   **Recommended (via Docker):**
        ```bash
        make qtc
        ```
    *   **Alternative (requires `task` CLI and Go installed locally):**
        ```bash
        task qtc
        ```
*   **Output:** `.qtpl.go` files alongside their corresponding `.qtpl` files.

---

#### **7. Docker Image Build**

This process builds the Docker development image used by the `Makefile` targets.

*   **Orchestration:** `Makefile` (`image-build` target) -> `docker build`
*   **Purpose:** To create the `nexus-ux-dev` Docker image that contains all necessary build tools (Go, Node.js, pnpm, Deno, esbuild, etc.) for consistent builds.
*   **How to Execute:**
    ```bash
    make image-build
    ```
*   **Output:** A Docker image tagged `nexus-ux-dev:1.24` (or whatever version is in `VERSION` file).

---

#### **8. Development Server (`dev`)**

This process starts a local development server for the site.

*   **Orchestration:** `Taskfile.yml` (`dev` task) -> `go tool task -w`
*   **Purpose:** To run the site in development mode with live reloading.
*   **How to Execute:**
    *   **Recommended (via Docker):**
        ```bash
        make dev
        ```
    *   **Alternative (requires `task` CLI and Go installed locally):**
        ```bash
        task dev
        ```
*   **Output:** A running web server, typically on `http://localhost:8080`.

---

#### **9. Testing**

The project includes various testing tasks.

*   **Orchestration:** `Taskfile.yml` (`test`, `test-all` tasks) -> `go test`
*   **Purpose:** To run unit and integration tests for the Go components of the project.
*   **How to Execute:**
    *   **Recommended (via Docker):**
        ```bash
        make test      # Runs unit tests
        make test-all  # Runs all tests
        ```
    *   **Alternative (requires `task` CLI and Go installed locally):**
        ```bash
        task test
        ```
*   **Output:** Test results in the console.

---

#### **10. Publishing (`libpub`, `sdktspub`)**

These tasks handle publishing the main library and the TypeScript SDK.

*   **Orchestration:** `Taskfile.yml` (`libpub`, `sdktspub` tasks)
*   **Purpose:** To build, tag, push, and publish the main Datastar library to npm and the TypeScript SDK to npm.
*   **How to Execute:**
    *   **Recommended (via Docker):**
        ```bash
        make libpub
        make sdktspub
        ```
    *   **Alternative (requires `task` CLI, Git, npm/pnpm, Deno, and network access):**
        ```bash
        task libpub
        task sdktspub
        ```
*   **Output:** Published packages to npm, Git tags, and cache purges for CDN.

---

#### **11. Tooling (`tools`)**

This task ensures necessary build tools are present.

*   **Orchestration:** `Taskfile.yml` (`tools` task)
*   **Purpose:** To download platform-specific binaries (like `tailwindcli`) and set up other development tools.
*   **How to Execute:**
    *   **Recommended (via Docker):**
        ```bash
        make tools
        ```
    *   **Alternative (requires `task` CLI, `wget`, `npx` locally):**
        ```bash
        task tools
        ```
*   **Output:** Downloaded binaries and configured tools.

---

This comprehensive overview should provide you with a complete understanding of all build processes within the Nexus UX repository, enabling you to properly maintain and extend the codebase.
