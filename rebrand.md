# Rebranding: Datastar to Nexus UX

This document outlines the steps to rebrand the forked "Datastar" project to "Nexus UX".

## Overview
Rebranding Report: Datastar to Nexus UX

This report details occurrences of "Datastar" and "datastar" within the repository and suggests replacement strategies based on the refined criteria.

## Branding Rules

-   **Primary Branding:** "Nexus-UX" (with a hyphen) is the default and preferred branding for general use, documentation, and display names.
-   **Hyphen-Forbidden Contexts:** Only when hyphens are explicitly disallowed by the technical context (e.g., certain programming language identifiers, URLs, package names) will the hyphen-less variations be used. In such cases, the casing will be adapted to the specific context:
    *   **PascalCase:** "NexusUX" (e.g., for class names, type names).
    *   **lowercase:** "nexusux" (e.g., for variable names, function names, file paths where hyphens are not standard).
    *   **uppercase:** "NEXUSUX" (e.g., for constants).

## Replacement Rules for "Datastar"

### Branding-Related Replacements

These occurrences refer to the product name, project name, URLs, package names, or general branding and should be updated according to the branding rules above.

-   **PascalCase "Datastar"**: Replace with "NexusUX" (or "Nexus UX" in prose)
    *   Description: Product name in documentation, titles, comments, display names.
    *   Suggested Replacement: NexusUX (or Nexus-UX in human-readable text).
    *   Representative Examples:
        *   `usage-guide.md`: `### **Nexus UX (Datastar) Core and Plugin Functionalities**` -> `### **Nexus-UX Core and Plugin Functionalities**`
        *   `README.md`: `# Datastar` -> `# Nexus-UX`
        *   `CONTRIBUTING.md`: `# Contributing to Datastar` -> `# Contributing to Nexus-UX`
        *   `SSE_Events_Reference.html`: `<meta property="og:site_name" content="Datastar">` -> `<meta property="og:site_name" content="Nexus-UX">`
        *   `developers-guide.md`: `Welcome, adventurer, to Datastar.` -> `Welcome, adventurer, to Nexus-UX.`
        *   `site/routes_home.templ`: `<div class="text-3xl md:text-5xl text-primary">Datastar</div>` -> `<div class="text-3xl md:text-5xl text-primary">Nexus-UX</div>`
        *   `tools/vscode-extension/package.json`: `"displayName": "Datastar"` -> `"displayName": "Nexus-UX"`
        *   `tools/intellij-plugin/gradle.properties`: `pluginName=Datastar` -> `pluginName=Nexus-UX`

-   **Lowercase "datastar"**:
    *   Description: Product name in code (variables, function names, package names, URLs, filenames), general mentions.
    *   **Preferred Replacement (where hyphens are allowed):** "nexus-ux" (e.g., filenames, URLs, some variable names)
    *   **Alternative Replacement (where hyphens are forbidden):** "nexusux" (e.g., certain programming language identifiers, package names that do not support hyphens)
    *   Representative Examples:
        *   `router-spec.md`: `<script type="module" src="/path/to/datastar.js"></script>` -> `<script type="module" src="/path/to/nexus-ux.js"></script>`
        *   `go.mod`: `module github.com/starfederation/datastar` -> `module github.com/aereaco/nexus-ux`
        *   `fly.toml`: `app = "datastar"` -> `app = "nexus-ux"`
        *   `library/package.json`: `"name": "@starfederation/datastar"` -> `"name": "@aereaco/nexus-ux"`
        *   `sdk/zig/build.zig.zon`: `.name = .datastar,` -> `.name = .nexusux,`
        *   `site/tailwind.config.js`: `datastar: {` -> `nexusux: {`
        *   `site/static/images/datastar_icon.svg` (filename) -> `site/static/images/nexus-ux_icon.svg`
        *   `site/static/images/datastar.svg` (filename) -> `site/static/images/nexus-ux.svg`
        *   `site/static/favicon/site.webmanifest`: `"name": "Datastar",` -> `"name": "Nexus-UX",`
        *   `tools/vscode-extension/package.json`: `"name": "datastar-vscode"` -> `"name": "nexus-ux-vscode"`
        *   `tools/intellij-plugin/settings.gradle.kts`: `rootProject.name = "datastar-jetbrains-plugin"` -> `rootProject.name = "nexus-ux-jetbrains-plugin"`

-   **Uppercase "DATASTAR"**: Replace with "NEXUSUX"
    *   Description: Uppercase constant referring to the product name (e.g., in SVG text).
    *   Suggested Replacement: NEXUSUX
    *   Representative Examples:
        *   `site/static/images/datastar.svg`: `y="190.22688">DATASTAR</tspan></text>` -> `y="190.22688">NEXUSUX</tspan></text>`

### Functional/API-Related Replacements

These occurrences refer to internal framework identifiers, API elements, or specific technical terms that should be updated to "State" or "state" to reflect the new conceptual model.

-   **`DATASTAR` (uppercase constant)**: Replace with `STATE` (for constant name) and `"state"` (for string value)
    *   Description: Core framework identifier used in code.
    *   Suggested Replacement:
        *   Constant name `DATASTAR` -> `STATE`
        *   String value `"datastar"` -> `"state"`
    *   Representative Examples:
        *   `library/src/engine/consts.ts`: `export const DATASTAR = "datastar";` -> `export const STATE = "state";`
        *   `library/src/utils/dom.ts`: `constructor(prefix = DATASTAR)` -> `constructor(prefix = STATE)`
        *   `library/src/engine/types.ts`: `export const DATASTAR_SIGNAL_EVENT = ${DATASTAR}-signals` -> `export const STATE_SIGNAL_EVENT = ${STATE}-signals`
        *   `library/src/plugins/official/browser/attributes/persist.ts`: `const storageKey = DATASTAR` -> `const storageKey = STATE`
        *   `library/src/plugins/official/browser/attributes/onSignalPatch.ts`: `export const DATASTAR_SIGNAL_PATCH_EVENT = ${DATASTAR}-signals-patch` -> `export const STATE_SIGNAL_PATCH_EVENT = ${STATE}-signals-patch`
        *   `library/src/plugins/official/backend/actions/fetch.ts`: `if (!evt.event.startsWith(DATASTAR)) return` -> `if (!evt.event.startsWith(STATE)) return`
        *   `library/src/plugins/official/backend/actions/fetch.ts`: `queryParams.set(DATASTAR, res)` -> `queryParams.set(STATE, res)`
        *   `sdk/typescript/src/consts.ts`: `export const DATASTAR = "datastar" as const;` -> `export const STATE = "state" as const;`
        *   `sdk/rust/src/consts.rs`: `pub(crate) const DATASTAR_KEY: &str = "datastar";` -> `pub(crate) const STATE_KEY: &str = "state";`
        *   `sdk/ruby/lib/datastar/consts.rb`: `DATASTAR_KEY = 'datastar'` -> `STATE_KEY = 'state'`
        *   `sdk/python/src/datastar_py/consts.py`: `DATASTAR_KEY = "datastar"` -> `STATE_KEY = "state"`
        *   `sdk/php/src/Consts.php`: `public const DATASTAR_KEY = 'datastar';` -> `public const STATE_KEY = 'state';`
        *   `sdk/java/core/src/main/java/starfederation/datastar/Consts.java`: `public static final String DATASTAR_KEY = "datastar";` -> `public static final String STATE_KEY = "state";`
        *   `sdk/clojure/sdk/src/main/starfederation/datastar/clojure/consts.clj`: `(def datastar-key "datastar")` -> `(def state-key "state")`

-   **`DATASTAR_REQUEST` (uppercase constant)**: Replace with `STATE_REQUEST` (for constant name) and `"State-Request"` (for string value)
    *   Description: HTTP header for framework requests.
    *   Suggested Replacement:
        *   Constant name `DATASTAR_REQUEST` -> `STATE_REQUEST`
        *   String value `"Datastar-Request"` -> `"State-Request"`
    *   Representative Examples:
        *   `library/src/engine/consts.ts`: `export const DATASTAR_REQUEST = "Datastar-Request";` -> `export const STATE_REQUEST = "State-Request";`
        *   `library/src/plugins/official/backend/actions/fetch.ts`: `[DATASTAR_REQUEST]: true,` -> `[STATE_REQUEST]: true,`
        *   `sdk/typescript/src/consts.ts`: `export const DATASTAR_REQUEST = "Datastar-Request";` -> `export const STATE_REQUEST = "State-Request";`
        *   `sdk/rust/src/consts.rs`: `pub(crate) const DATASTAR_REQ_HEADER_STR: &str = "datastar-request";` -> `pub(crate) const STATE_REQ_HEADER_STR: &str = "state-request";`

-   **`DatastarComponent`**: Replace with `BaseComponent`
    *   Description: Base class for components.
    *   Suggested Replacement: `BaseComponent`
    *   Representative Examples:
        *   `usage-guide.md`: `// Inside DatastarComponent's connectedCallback` -> `// Inside BaseComponent's connectedCallback`
        *   `library/src/plugins/official/browser/attributes/component.ts`: `export class BaseComponent extends HTMLElement {` (already `BaseComponent` in source, but comments/docs might refer to `DatastarComponent`)
        *   `test/test.html`: `initDatastarComponents(window.Datastar);` -> `initDatastarComponents(window.State);` (This is a usage, not definition, so it should follow `window.Datastar` replacement)

-   **`window.Datastar`**: Replace with `window.State`
    *   Description: Global JavaScript object.
    *   Suggested Replacement: `window.State`
    *   Representative Examples:
        *   `test/test.html`: `initDatastarComponents(window.Datastar);` -> `initDatastarComponents(window.State);`
        *   `library/src/plugins/official/browser/attributes/component.ts`: `(window as any)[globalContextKey].$actions[exportName] = module[exportName];` (This is internal, the `globalContextKey` itself will change to reflect state.)

-   **`datastar.NewSSE`, `datastar.ReadSignals`, etc. (Go SDK function calls)**: Replace with `state.NewSSE`, `state.ReadSignals`
    *   Description: Go SDK function calls.
    *   Suggested Replacement: `state.NewSSE`, `state.ReadSignals`, etc. (change `datastar` package import alias to `state`)
    *   Representative Examples:
        *   `developers-guide.md`: `sse.MergeFragments(html, datastar.WithSelectorID("profile"), datastar.WithMergeMorph())` -> `sse.MergeFragments(html, state.WithSelectorID("profile"), state.WithMergeMorph())`
        *   `site/shared_partials.go`: `build "github.com/starfederation/datastar/build"` -> `build "github.com/aereaco/nexusux/build"` (module path change)
        *   `site/shared_partials.go`: `"github.com/starfederation/datastar/sdk/go/datastar"` -> `"github.com/aereaco/nexusux/sdk/go/state"` (import path and package name change)
        *   `site/routes_videos.go`: `sse := datastar.NewSSE(w, r)` -> `sse := state.NewSSE(w, r)`

-   **`datastar-` prefixed event/attribute names (kebab-case)**: Replace with `state-` (functional) or `nexus-ux-` (branding)
    *   Description: HTML attributes, SSE event names.
    *   Suggested Replacement:
        *   Functional: `datastar-merge-fragments` -> `state-merge-fragments`
        *   Branding (e.g., web-types definitions): `datastar-bind-modifiers` -> `nexus-ux-bind-modifiers`
    *   Representative Examples:
        *   `SSE_Events_Reference.html`: `datastar-patch-elements` -> `state-patch-elements`
        *   `site/static/md/reference/sse_events.md`: `datastar-merge-fragments` -> `state-merge-fragments`
        *   `site/static/md/reference/action_plugins.md`: `datastar-sse` -> `state-sse`
        *   `site/static/md/reference/security.md`: `data-star-ignore` -> `data-state-ignore`
        *   `tools/intellij-plugin/src/main/resources/datastar-attributes.web-types.json`: `"datastar-bind-modifiers"` -> `"nexus-ux-bind-modifiers"`

## File and Directory Renaming

These are explicit renames listed in `rebrand.md`.

-   `bundles/datastar.js` -> `bundles/nexus-ux.js`
-   `bundles/datastar.js.map` -> `bundles/nexus-ux.js.map`
-   `bundles/datastar-core.js` -> `bundles/nexus-ux-core.js`
-   `bundles/datastar-core.js.map` -> `bundles/nexus-ux-core.js.map`
-   `bundles/datastar-aliased.js` -> `bundles/nexus-ux-aliased.js`
-   `bundles/datastar-aliased.js.map` -> `bundles/nexus-ux-aliased.js.map`
-   `datastar-website` -> `nexus-ux-website`
-   `tools/vscode-extension/datastar-vscode` -> `tools/vscode-extension/nexus-ux-vscode`
-   `tools/intellij-plugin/datastar-jetbrains-plugin` -> `tools/intellij-plugin/nexus-ux-jetbrains-plugin`
-   `site/static/images/datastar_icon.svg` -> `site/static/images/nexus-ux_icon.svg`
-   `site/static/images/datastar.svg` -> `site/static/images/nexus-ux.svg`

## Other Considerations

-   **Comments**: Many comments contain "Datastar" and should be updated to "Nexus-UX" as appropriate.
-   **URLs in comments/docs**: URLs like `https://github.com/starfederation/datastar` should be updated to `https://github.com/aereaco/nexus-ux`.
-   **`data-star.dev`**: This domain should be replaced with `nexus.aerea.co`.
-   **`datastar_py` (Python package name)**: This should become `nexusux_py`.
-   **`StarFederation.Datastar` (C# namespace)**: This should become `AereaCo.NexusUX`.
-   **`starfederation/datastar` (Clojure namespace)**: This should become `aereaco/nexusux`.

This report provides a comprehensive overview of the rebranding changes. The key is to differentiate between branding and functional terms to apply the correct replacement.