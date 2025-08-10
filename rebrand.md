# Rebranding: Datastar to Nexus-UX

This document outlines the steps to rebrand the forked "Datastar" project to "Nexus-UX".

## Overview
Rebranding Specs: Datastar to Nexus-UX

This spec sheet details occurrences of "Datastar" and "datastar" within the repository and suggests replacement strategies based on the refined criteria. Be very decerning between functional and branding. Simple rule is if it performs a function/operation it falls under functional, if it only describe the framework as a whole it more than likely branding

## Branding Rules

-   **Primary Branding:** "Nexus-UX" (with a hyphen) is the default and preferred branding for general use, documentation, and display names.
-   **Hyphen-Forbidden Contexts:** Only when hyphens are explicitly disallowed by the technical context (e.g., certain programming language identifiers, URLs, package names) will the hyphen-less variations be used. In such cases, the casing will be adapted to the specific context:
    *   **PascalCase:** "NexusUX" (e.g., for class names, type names).
    *   **lowercase:** "nexusux" (e.g., for variable names, function names, file paths where hyphens are not standard).

## Replacement Rules for "Datastar"

### Branding-Related Replacements

These occurrences refer to the product name, project name, URLs, package names, or general branding and should be updated according to the branding rules above.

-   **PascalCase "Datastar"**: Replace with "Nexus-UX".
    *   Description: Product name in documentation, titles, comments, display names.
    *   Suggested Replacement: Nexus-UX.
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
        *   `go.mod`: `module github.com/starfederation/datastar` -> `https://github.com/aereaco/nexus-ux`
        *   `fly.toml`: `app = "datastar"` -> `app = "nexus-ux"`
        *   `library/package.json`: `"name": "@starfederation/datastar"` -> `"name": "@aereaco/nexus-ux"`
        *   `sdk/zig/build.zig.zon`: `.name = .datastar,` -> `.name = .nexusux,`
        *   `site/tailwind.config.js`: `datastar: {` -> `nexusux: {`
        *   `site/static/images/datastar_icon.svg` (filename) -> `site/static/images/nexus-ux_icon.svg`
        *   `site/static/images/datastar.svg` (filename) -> `site/static/images/nexus-ux.svg`
        *   `site/static/favicon/site.webmanifest`: `"name": "Datastar",` -> `"name": "Nexus-UX",`
        *   `tools/vscode-extension/package.json`: `"name": "datastar-vscode"` -> `"name": "nexus-ux-vscode"`
        *   `tools/intellij-plugin/settings.gradle.kts`: `rootProject.name = "datastar-jetbrains-plugin"` -> `rootProject.name = "nexus-ux-jetbrains-plugin"`

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

-   **`datastar-` prefixed event/attribute names (kebab-case)**: Replace with `state-` (functional) or `attribute-` (functional, for modifiers)
    *   Description: HTML attributes, SSE event names, and attribute modifiers.
    *   Suggested Replacement:
        *   Functional: `datastar-merge-fragments` -> `state-merge-fragments`
        *   Functional (for modifiers, e.g., web-types definitions): `datastar-bind-modifiers` -> `attribute-bind-modifiers`
    *   Representative Examples:
        *   `SSE_Events_Reference.html`: `datastar-patch-elements` -> `state-patch-elements`
        *   `site/static/md/reference/sse_events.md`: `datastar-merge-fragments` -> `state-merge-fragments`
        *   `site/static/md/reference/action_plugins.md`: `datastar-sse` -> `state-sse`
        *   `site/static/md/reference/security.md`: `data-star-ignore` -> `data-state-ignore`
        *   `tools/intellij-plugin/src/main/resources/datastar-attributes.web-types.json`: `"datastar-bind-modifiers"` -> `"attribute-bind-modifiers"`

   Along with these specific replacements, ensure that any references to "Datastar" in the context of events, signals & other programic or functional identifiers are replaced with "State", "STATE" or "state" as appropriate.  

## Other Considerations

-   **Comments**: Many comments contain "Datastar" and should be updated to "Nexus-UX" as appropriate.
-   **`DatastarPlugin`**: This term should be replaced with "StatePlugin" in the context of plugins.
-   **`datastar-script-attributes`**: This term should be replaced with "state-script-attributes" in the context of script attributes.
-   **`IDatastarSignalsReaderService`**: This interface should be replaced with `IStateSignalsReaderService` in the context of TypeScript interfaces.
-   **`DatastarResponse`**: This class should be replaced with `StateResponse` in the context of TypeScript classes.
-   **`Star Federation`**: This term should be replaced with "Aerea Co." in branding contexts.
-   **`StarFederation`**: This term should be replaced with "AereaCo".
-   **`starfederation`**: This term should be replaced with "aereaco" in package names, URLs, and other identifiers.
-   **URLs**: URLs like `https://github.com/starfederation/datastar` should be updated to `https://github.com/aereaco/nexus-ux`.
-   **`data-star.dev`**: This domain should be replaced with `nexus.aerea.co`.
-   **`datastar_py` (Python package name)**: This has been updated to `nexusux_py`.
-   **`StarFederation.Datastar` (C# namespace)**: This has been updated to `AereaCo.NexusUX`.
-   **`starfederation/datastar` (Clojure namespace)**: This has been updated to `aereaco/nexusux`.
-   **`[Datastar]` console logs**: Update to `[Nexus-UX]` for consistency in console output.
-   **`Nexus-UX vs Datastar Comparison`**: When comparing features or functionalities, ensure that the context is clear and that "Nexus-UX" is used for the new branding while "Datastar" is used for historical references.

    Example: 
    
    "Deep Dive Comparative Analysis: Nexus UX vs. Datastar (Beta 11 & RC 2)"

    In this context, "Nexus UX" refers to the new branding, while "Datastar" refers to the previous version or historical context and should not be rebranded.

## Replacement Technique

In order to ensure consistent, accurate and performant updates in the rebranding process, instead of doing string-by-string replacements and singular diff operations, you will process one entire file at a time, read and store the entire contents of the file in memory, display all changes needed for each file as it is processed, apply all changes in memory then write the entire updated file to disk in one operation. Absolutely DO NOT perform micro edits per file, perform all updates in one operation, DO NOT use the replace or edit tools instead only use the write_file tool. Once all files are process run "tsc" in the library folder to check for typescript errors, if any are found they should be fixed accordingly and once all are remidiated run "tsc" again to ensure no more errors, repeat this process until no errors are found. This will ensure that all changes are applied in a single operation, reducing the risk of partial updates and improving performance.

Note: Our rebranding process is only concerned with what was stated above, so outside of the scope of this document, no other type of changes should be made to the codebase. This includes but is not limited to: functional changes, performance improvements, bug fixes, or any other type of change that is not directly related to the rebranding process.

## Conclusion

This spec sheet provides a comprehensive overview of the rebranding changes. The key is to differentiate between branding and functional terms to apply the correct replacements. The focus is on maintaining clarity in the codebase while ensuring that the new branding or functional identification is consistently applied across all documentation, code, and user interfaces.
This rebranding effort will help unify the project under the new "Nexus-UX" identity while preserving the functional integrity of the codebase. By following these guidelines, we can ensure a smooth transition and clear communication of the project's purpose and capabilities.
