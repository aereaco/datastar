# Router Refactoring Plan: Addressing SignalCycleDetected and Plugin Consistency

## Introduction

This document outlines a comprehensive plan for refactoring the client-side router in Nexus-UX. It consolidates a previously implemented refactoring plan, addresses identified plugin consistency issues, and incorporates design insights from the Pinecone router to mitigate `SignalCycleDetected` errors and improve overall code quality.

## Original Router Solution Refactoring Plan (Already Implemented)

The core problem addressed by this original plan was the `SignalCycleDetected` error, suggesting a circular dependency or a signal being accessed before it's fully stable during initialization. The setup, where `router.ts` was a `WatcherPlugin` and relied on `data-signals` attributes, was identified as a contributing factor.

The proposed solution was to refactor the router into an `AttributePlugin` that directly consumes a `data-router` attribute, allowing the router to manage its own initial state more directly, reducing potential race conditions and simplifying the setup.

### Plan & Reasoning (Original Implementation)

Here is the detailed plan that was previously implemented:

**Phase 1: Refactor `Router` Class to `AttributePlugin`**

1.  **File Location:** The `router.ts` file is currently located at `library/src/plugins/official/browser/attributes/router.ts`. This is its correct and intended location for this refactoring.

2.  **Modify `Router` Class Definition:**
    *   Change the class declaration from `export class Router implements WatcherPlugin` to `export class Router implements AttributePlugin`.
    *   Update the `type` property within the class from `type: PluginType.Watcher` to `type: PluginType.Attribute`.
    *   Add `keyReq: Requirement = Requirement.Allowed;` and `valReq: Requirement = Requirement.Allowed;` to the `Router` class definition. These properties define how the `data-router` attribute can be used (e.g., `data-router` or `data-router.sub.key`).

3.  **Rename and Adjust Initialization Method:**
    *   Rename the `onGlobalInit(ctx: InitContext)` method to `onLoad(ctx: RuntimeContext)`. The `onLoad` method is the standard entry point for `AttributePlugins` and receives a `RuntimeContext` object.
    *   **Signal Initialization Logic within `onLoad`:**
        *   The `onLoad` method will receive `ctx.value` (the full string value of the `data-router` attribute, e.g., `"{default: {route: '#Home'}, mode: 'hybrid'}"`) and `ctx.key` (if a sub-key is used, e.g., `default.route` from `data-router.default.route`).
        *   **Initial Router Signal Setup:** All core `$router` signals (e.g., `$router.path`, `$router.params`, `$router.loading`, `$router.default.route`, etc.) will be initialized using `signals.upsertIfMissing` at the beginning of the `onLoad` method. This ensures a consistent base state for the router.
        *   **Handling `data-router` Attribute Value:**
            *   If `ctx.key` is present (e.g., `data-router.default.route="someValue"`), it means a specific `$router` sub-signal is being configured. I will use `signals.setValue(\$router.${ctx.key}\, ctx.untracked(() => ctx.rx()));` to set the value. `ctx.untracked(() => ctx.rx())` is crucial here to evaluate the attribute's expression without creating a reactive dependency during the initial setup, thus preventing signal cycles.
            *   If `ctx.key` is not present but `ctx.value` is (e.g., `data-router="{default: {route: '#Home'}, mode: 'hybrid'}"`), it means a full object is being passed. I will use `signals.merge(ctx.untracked(() => ctx.rx()));` to merge this object into the `$router` signal tree, again using `ctx.untracked(() => ctx.rx())` for safe evaluation.
    *   **Base Path Detection:** The existing logic for `basePath` detection will remain within `onLoad`.
    *   **Global `window.$router.navigate` Exposure:** The `window.$router.navigate` function will continue to be exposed globally within `onLoad`.
    *   **Event Listeners:** The `ROUTER_POPSTATE_EVENT` and `click` event listeners will remain set up within `onLoad`.
    *   **Initial Page Load Handling:** The `queueMicrotask` block that handles the initial route resolution (`resolveAndLoadRoute(initialUrl)`) will remain in `onLoad`. This ensures that when the `data-router` attribute is processed on the `<html>` tag, the router initializes and resolves the current URL.

**Phase 2: Update Main Bundle File (`nexus-ux.ts`)**

1.  **File Location:** `library/src/bundles/nexus-ux.ts`.
2.  **Import Statement:** Update the import statement for the `Router` class to reflect its new type (`AttributePlugin`) and its location: `import { Router } from '../plugins/official/browser/attributes/router'`.
3.  **Loading the Plugin:** In the `load()` function, ensure `new Router()` is called to instantiate and load the `Router` as an `AttributePlugin`.

**Phase 3: Update HTML Usage (`test/index.html`)**

1.  **File Location:** `test/index.html`.
2.  **Attribute Syntax Change:**
    *   Remove any existing `data-signals` attributes that were used to initialize `$router` signals (e.g., `data-signals="{router: {default: {route: '#Home'}, mode: 'hybrid'}}" `or `data-signals-router.default.route="#Home"`).
    *   Add the new `data-router` attribute to the `<html>` tag (or the appropriate root element where the router should be initialized).
    *   Example: `<html lang="en" data-router="{default: {route: '#Home'}, mode: 'hybrid'}">` or `<html lang="en" data-router.default.route="'#Home'">`.

**Phase 4: Update Documentation (`router-spec.md`)**

1.  **File Location:** `router-spec.md`.
2.  **Update Router Activation & Modes:**
    *   Modify the section describing router activation to reflect that the router is now activated by the presence of the `data-router` attribute on the `<html>` tag, rather than `data-signals-router.mode`.
    *   Update examples to use `data-router` syntax.
3.  **Update Key Internal State (Nexus UX Signals):**
    *   Clarify that the `$router` signals are now primarily initialized and managed by the `Router` attribute plugin itself, via the `data-router` attribute.
    *   Remove any references to `data-signals-router.base-path` and explain that base path detection is now handled directly by the `data-router` attribute.
4.  **Update Router Components & Mechanisms:**
    *   In the description of the Router Core Module, explicitly state that it is now an `AttributePlugin` and its `onLoad` method is responsible for initialization.
    *   Remove any mention of `data-signals` in relation to router state initialization.
    *   Update any code examples to use the `data-router` attribute.
5.  **Update Technical Implementation Steps:**
    *   Adjust the "Define Core Router Signals" step to reflect that these signals are now initialized within the `Router` attribute plugin's `onLoad` method, driven by the `data-router` attribute.
    *   Modify the "Initial Page Load Handling" to emphasize that the `onLoad` of the `data-router` attribute is the trigger for router initialization.
    *   Ensure all examples and descriptions align with the `data-router` attribute usage.

## Identified Plugin Consistency Issues

During the review of the existing router implementation, the following plugin consistency concerns were identified:

1.  **No other plugin imports `SignalsRoot` or `untracked` directly.** The `router.ts` file currently has top-level imports for `SignalsRoot` and `untracked`. This deviates from the standard Nexus-UX plugin pattern where these are accessed via the `ctx` object.
2.  **Malformed `const { ... } = ctx;` statement.** The `router.ts` destructures `signals`, `runtimeErr`, and `untracked` from `ctx`. While `runtimeErr` and `untracked` are valid properties of `ctx`, the primary concern is the direct top-level import of `SignalsRoot` and `untracked`, which this point highlights as a symptom of the inconsistency. Also no other plugin destructures `runtimeErr` or `untracked` from `ctx`, nor do they use `ctx.runtimeErr` or `ctx.untracked` to access them. Using `const { el, key, mods, signals, value, genRX, effect } = ctx` or similar destructuring is a common pattern in Nexus-UX.
3.  **Inconsistent `onLoad` signature.** The `onLoad` method in `router.ts` explicitly uses the `ctx: RuntimeContext` type annotation. Other plugins typically omit this explicit type, relying on TypeScript's inference, resulting in a signature like `onLoad(ctx)`.

## Pinecone Router Insights

Analysis of the Pinecone router revealed a crucial design pattern: Pinecone consistently passes a `Context` object to its handlers, thereby avoiding direct global access to reactivity primitives like `SignalsRoot` or `untracked`. This approach is key to preventing unintended side effects and signal cycle issues, which aligns directly with the `SignalCycleDetected` errors observed in Nexus-UX. Analyze the files in @pincoe to get an understanding of how the pinecone router works and how it uses context to manage signals and reactivity. Ignore the gitignore flag to access the files.

## Revised Refactoring Plan (Consolidated and Updated)

This revised plan incorporates the original refactoring steps, addresses the identified consistency issues, and integrates the insights from the Pinecone router to enforce a more robust and consistent plugin architecture.

1.  **Modify `library/src/plugins/official/browser/attributes/router.ts`:**
    *   **Remove Direct Imports:** Eliminate top-level imports for `SignalsRoot` and `untracked`.
    *   **Standardize Context Usage:** Ensure all interactions with signals and untracked expressions are exclusively done through the `ctx` object passed to the `onLoad` method. This means:
        *   Replacing `signals.upsertIfMissing(...)` with `ctx.signals.upsertIfMissing(...)`.
        *   (The existing uses of `untracked(() => ctx.rx())` for attribute value processing are already correct in this regard, as `ctx.rx()` is a method of the `ctx` object.)
    *   **Update `onLoad` Signature:** Change the `onLoad` method signature from `onLoad(ctx: RuntimeContext)` to `onLoad(ctx)` for stylistic consistency.

2.  **Update `router-spec.md`:**
    *   Reflect these changes in the documentation, specifically noting that `signals` and `untracked` are accessed through the `ctx` object and updating the `onLoad` signature example. Emphasize that all signal and untracked operations within the router plugin are performed via the `ctx` object, aligning with the pattern of passing a context to handlers. This will also highlight the improved consistency and reduced risk of signal cycle issues.

## Syntax Usage Change

**Prior to refactoring (current usage)**

`data-signals-router.default.route="#Home"`

or

`data-signals="{router: {default: {route: '#Home'}, mode: 'hybrid'}}"`

**After refactoring (new usage)**

`data-router.default.route="#Home"`

or

`data-router="{default: {route: '#Home'}, mode: 'hybrid'}}"`

## File Update Method

With such large changes the usage of "Edit" and "Replace" tools are usually unreliable and causes syntax errors so do not use them, instead we encourage to properly update files and ensure they are error free in this refactoring process to first read, store and edit each file in memory then using the "WriteFile" tool write the complete updated back to disk. Once all necessary files are updated in this manner run "cd library && tsc && task build" to check for typescript errors and build, however if any errors occur address them accordingly and re-run the check and build commands just given and repeat process until all errors are fixed.

## Files & Folders

The following list is all the files and folders relative to this refactoring plan:

@router-spec.md
@library/
@test/

## Errors

The following are the errors this plan is designed to address:

```
engine.ts:444  [Nexus-UX] Error loading plugin "component" on element <dynamic-component1 data-component=​"$router.default.route" id=​"statebfx7gu">​…​</dynamic-component1>​ for attribute "data-component": state internal error: SignalCycleDetected
More info: https://nexus.aerea.co/errors/internal/signal_cycle_detected?metadata=%7B%22from%22%3A%22preact-signals%22%7D
Context: {
  "from": "preact-signals"
}
    at ft (http://127.0.0.1:3000/bundles/nexus-ux.js:2:3027)
    at re (http://127.0.0.1:3000/bundles/nexus-ux.js:4:47)
    at H.set (http://127.0.0.1:3000/bundles/nexus-ux.js:4:2570)
    at Ue.<anonymous> (http://127.0.0.1:3000/bundles/nexus-ux.js:43:1301)
    at Ue._callback (http://127.0.0.1:3000/bundles/nexus-ux.js:4:5643)
    at gt (http://127.0.0.1:3000/bundles/nexus-ux.js:4:786)
    at Ue.cr (http://127.0.0.1:3000/bundles/nexus-ux.js:4:5411)
    at Ue._callback (http://127.0.0.1:3000/bundles/nexus-ux.js:4:5697)
    at we (http://127.0.0.1:3000/bundles/nexus-ux.js:4:6096)
    at effect (http://127.0.0.1:3000/bundles/nexus-ux.js:4:12670)
Ne @ engine.ts:444
(anonymous) @ engine.ts:155
pe @ dom.ts:73
pe @ dom.ts:77
pe @ dom.ts:77
pe @ dom.ts:77
pe @ dom.ts:77
pe @ dom.ts:77
pe @ dom.ts:77
pe @ dom.ts:77
tt @ engine.ts:121
_loadAndRender @ component.ts:169
connectedCallback @ component.ts:213
$r @ component.ts:526
await in $r
(anonymous) @ component.ts:637
Ue._callback @ preact-core.ts:780
we @ preact-core.ts:836
effect @ engine.ts:271
onLoad @ component.ts:630
Ne @ engine.ts:331
(anonymous) @ engine.ts:155
pe @ dom.ts:73
pe @ dom.ts:77
pe @ dom.ts:77
tt @ engine.ts:121
(anonymous) @ engine.ts:111
```
