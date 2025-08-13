# GraphQL Plugin Specification for Nexus-UX

## 1. Introduction & Motivation

GraphQL has emerged as a powerful alternative to REST for API design, offering efficient data fetching, strong typing, and a flexible query language. Integrating native, declarative GraphQL support into Nexus-UX will:

*   **Streamline Data Fetching:** Allow developers to declaratively define data requirements directly in HTML, reducing boilerplate code for API interactions.
*   **Improve Performance:** Leverage GraphQL's ability to fetch precisely the data needed, minimizing over-fetching and under-fetching.
*   **Enhance Developer Experience (DX):** Provide an intuitive, Nexus-UX-idiomatic way to consume GraphQL APIs, abstracting away the complexities of HTTP request construction and response parsing.
*   **Strengthen Competitive Position:** Offer a modern, comprehensive data fetching solution alongside existing HTTP and real-time (SSE, WebSockets) capabilities, making Nexus-UX a more attractive choice for applications built with GraphQL backends.

## 2. Core Design Principles

The GraphQL plugin will adhere to Nexus-UX's core design principles:

*   **Declarative:** Primarily driven by `data-*` attributes on HTML elements.
*   **Reactive:** Query results, loading states, and errors will be managed via Nexus-UX signals.
*   **Plugin-based:** Implemented as a standard Nexus-UX attribute plugin.
*   **Idiomatic:** Seamlessly integrates with existing `data-on`, `data-show`, `data-class`, `data-bind`, and other plugins.
*   **Robust:** Handles network failures, GraphQL errors, and provides mechanisms for refetching.
*   **Leverage Existing Infrastructure:** Built upon the existing `fetch` plugin for network communication.

## 3. Proposed `data-graphql` Attribute Plugin

This will be the primary interface for executing GraphQL queries and mutations. It will be an `AttributePlugin`.

*   **Name:** `graphql`
*   **Attribute:** `data-graphql`

### 3.1. Attributes & Modifiers

The `data-graphql` attribute will be placed on an element and its value will be the GraphQL query or mutation string.

```html
<div data-graphql="query { hello }"></div>
```

**Key Attributes/Modifiers:**

*   **`data-graphql="<query_string_or_signal>"` (Required):** The GraphQL query or mutation string. Can be a literal string or a signal path (e.g., `"$myQuerySignal"`) that resolves to a query string.
*   **`data-graphql-url="<url_string_or_signal>"` (Optional):** The GraphQL endpoint URL. Can be a literal string or a signal path. Defaults to `/graphql` if not provided.
*   **`data-graphql-variables="<json_object_or_signal>"` (Optional):** A JSON object or a signal path that resolves to a JSON object, containing the variables for the query/mutation.
    *   **Example:** `data-graphql-variables="{ id: $userId, type: 'admin' }"` or `data-graphql-variables="$queryVariables"`.
*   **`data-graphql-operation-name="<string_or_signal>"` (Optional):** The name of the GraphQL operation (for multi-operation queries). Can be a literal string or a signal path.
*   **`data-graphql-method="<method>"` (Optional):** The HTTP method to use (`'POST'` or `'GET'`). Defaults to `'POST'`.
*   **`data-graphql-headers="<json_object_or_signal>"` (Optional):** A JSON object or signal path resolving to an object, containing custom HTTP headers for the request.
*   **`data-graphql-result-signal="<signal_path>"` (Optional):** The signal path where the `data` payload from the GraphQL response will be stored. Defaults to `graphql.result`.
*   **`data-graphql-error-signal="<signal_path>"` (Optional):** The signal path where the `errors` array from the GraphQL response will be stored. Defaults to `graphql.error`.
*   **`data-graphql-loading-signal="<signal_path>"` (Optional):** A boolean signal path to indicate loading state (`true` during fetch, `false` after). Defaults to `graphql.loading`.
*   **`data-graphql-on-success="<expression>"` (Optional):** Executes an expression when the GraphQL request successfully returns data (even if `errors` are present). `event` context available (e.g., `event.detail.data`, `event.detail.errors`).
*   **`data-graphql-on-error="<expression>"` (Optional):** Executes an expression if a network error occurs or if the GraphQL response contains errors. `event` context available (e.g., `event.detail.error` for network, `event.detail.errors` for GraphQL errors).
*   **`data-graphql-on-complete="<expression>"` (Optional):** Executes an expression after the GraphQL request completes, regardless of success or error.
*   **`data-graphql-refetch-on-change="<signal_path_or_array>"` (Optional):** Automatically re-fetches the GraphQL query when the specified signal(s) change. Can be a single signal path or a JSON array of signal paths.
*   **`data-graphql-poll-interval="<ms>"` (Optional):** Milliseconds to wait before automatically re-fetching the query.

### 3.2. `onLoad` Logic (`AttributePlugin.onLoad`)

The `onLoad` method will handle the core logic for the `data-graphql` plugin.

```typescript
// library/src/plugins/official/browser/attributes/graphql.ts

import { AttributePlugin, PluginType, Requirement, RuntimeContext, CleanupUpdateCallback, MutationUpdateCallback } from '../../../../engine/types';
import { jsStrToObject } from '../../../../utils/text';
import { effect } from '../../../../vendored/preact-core';
import { fetcher, FetchArgs } from '../../backend/actions/fetch'; // Re-use existing fetcher

export const GraphQLPlugin: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'graphql',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,

  onLoad: (ctx: RuntimeContext) => {
    const { el, value: queryStringOrSignal, signals, effect, runtimeErr, genRX } = ctx;

    // Parse configuration from attributes
    const urlAttr = el.getAttribute('data-graphql-url') || '/graphql';
    const variablesAttr = el.getAttribute('data-graphql-variables') || '{}';
    const operationNameAttr = el.getAttribute('data-graphql-operation-name');
    const methodAttr = el.getAttribute('data-graphql-method') || 'POST';
    const headersAttr = el.getAttribute('data-graphql-headers') || '{}';
    const resultSignalPath = el.getAttribute('data-graphql-result-signal') || 'graphql.result';
    const errorSignalPath = el.getAttribute('data-graphql-error-signal') || 'graphql.error';
    const loadingSignalPath = el.getAttribute('data-graphql-loading-signal') || 'graphql.loading';
    const onSuccessExpr = el.getAttribute('data-graphql-on-success');
    const onErrorExpr = el.getAttribute('data-graphql-on-error');
    const onCompleteExpr = el.getAttribute('data-graphql-on-complete');
    const refetchOnChangeAttr = el.getAttribute('data-graphql-refetch-on-change');
    const pollInterval = parseInt(el.getAttribute('data-graphql-poll-interval') || '0', 10);

    // Initialize signals
    signals.upsertIfMissing(resultSignalPath, null);
    signals.upsertIfMissing(errorSignalPath, null);
    signals.upsertIfMissing(loadingSignalPath, false);

    let pollTimer: number | undefined;

    const executeGraphQL = async () => {
      signals.setValue(loadingSignalPath, true);
      signals.setValue(errorSignalPath, null); // Clear previous errors

      try {
        // Resolve reactive attributes
        const url = genRX()(urlAttr);
        const query = genRX()(queryStringOrSignal);
        const variables = jsStrToObject(genRX()(variablesAttr));
        const operationName = operationNameAttr ? genRX()(operationNameAttr) : undefined;
        const headers = jsStrToObject(genRX()(headersAttr));

        const fetchArgs: FetchArgs = {
          method: methodAttr as FetchArgs['method'],
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          contentType: 'json',
          filterSignals: { include: /.*/, exclude: /(^|\.)_/ }, // Send all relevant data
        };

        // Construct GraphQL request body
        const requestBody = {
          query,
          variables,
          operationName,
        };

        // Use fetcher directly for more control over body
        const response = await fetch(url, {
          method: fetchArgs.method,
          headers: fetchArgs.headers,
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          signals.setValue(errorSignalPath, { networkError: true, status: response.status, ...errorData });
          if (onErrorExpr) genRX()(onErrorExpr, { evt: { detail: { error: errorData, networkError: true } } });
          return;
        }

        const graphqlResponse = await response.json();

        if (graphqlResponse.errors) {
          signals.setValue(errorSignalPath, graphqlResponse.errors);
          if (onErrorExpr) genRX()(onErrorExpr, { evt: { detail: { errors: graphqlResponse.errors } } });
        } else {
          signals.setValue(resultSignalPath, graphqlResponse.data);
          if (onSuccessExpr) genRX()(onSuccessExpr, { evt: { detail: { data: graphqlResponse.data, errors: graphqlResponse.errors } } });
        }

      } catch (e: any) {
        signals.setValue(errorSignalPath, { message: e.message, error: e });
        runtimeErr('GraphQLFetchFailed', ctx, { error: e.message });
        if (onErrorExpr) genRX()(onErrorExpr, { evt: { detail: { error: e, networkError: true } } });
      } finally {
        signals.setValue(loadingSignalPath, false);
        if (onCompleteExpr) genRX()(onCompleteExpr, { evt: {} });
      }
    };

    // Initial fetch
    executeGraphQL();

    // Refetch on signal change
    let refetchEffectCleanup: CleanupUpdateCallback | undefined;
    if (refetchOnChangeAttr) {
      const refetchSignals = jsStrToObject(refetchOnChangeAttr); // Can be array or single signal
      refetchEffectCleanup = effect(() => {
        // This effect will re-run when any of the specified signals change
        // We need to ensure it doesn't re-run on initial setup or when GraphQL signals change
        // A simple way is to just trigger executeGraphQL
        executeGraphQL();
      });
    }

    // Polling
    if (pollInterval > 0) {
      pollTimer = setInterval(executeGraphQL, pollInterval) as any;
    }

    const cleanupCallback: CleanupUpdateCallback = () => {
      refetchEffectCleanup?.();
      if (pollTimer) clearInterval(pollTimer);
    };

    const mutationCallback: MutationUpdateCallback = (newValue) => {
      // If the query string itself changes, re-execute
      if (newValue && newValue !== queryStringOrSignal) {
        executeGraphQL();
      }
      // Re-evaluate refetch-on-change if attribute changes
      if (refetchOnChangeAttr) {
        refetchEffectCleanup?.(); // Re-run effect to pick up new signal path if it changed
      }
      // Re-evaluate polling if attribute changes
      if (pollInterval > 0 && !pollTimer) {
        pollTimer = setInterval(executeGraphQL, pollInterval) as any;
      } else if (pollInterval === 0 && pollTimer) {
        clearInterval(pollTimer);
        pollTimer = undefined;
      }
    };

    return { cleanupCallback, mutationCallback };
  },
};
```

## 4. Proposed `data-graphql-subscription` Attribute Plugin (High-Level)

GraphQL Subscriptions typically rely on WebSockets. This plugin would build directly on the proposed `data-websocket` plugin.

*   **Name:** `graphql-subscription`
*   **Attribute:** `data-graphql-subscription`
*   **Purpose:** Establishes a GraphQL subscription over a WebSocket connection and updates signals with incoming data.

**Key Attributes/Modifiers:**

*   **`data-graphql-subscription="<subscription_string_or_signal>"` (Required):** The GraphQL subscription query string.
*   **`data-graphql-subscription-url="<url_string_or_signal>"` (Optional):** The WebSocket endpoint URL for subscriptions. Defaults to `/graphql-ws` or similar.
*   **`data-graphql-subscription-variables="<json_object_or_signal>"` (Optional):** Variables for the subscription.
*   **`data-graphql-subscription-operation-name="<string_or_signal>"` (Optional):** Operation name for the subscription.
*   **`data-graphql-subscription-result-signal="<signal_path>"` (Optional):** Signal path for incoming subscription data. Defaults to `graphql.subscriptionResult`.
*   **`data-graphql-subscription-error-signal="<signal_path>"` (Optional):** Signal path for subscription errors. Defaults to `graphql.subscriptionError`.
*   **`data-graphql-subscription-loading-signal="<signal_path>"` (Optional):** Signal path for loading state.
*   **`data-graphql-subscription-on-message="<expression>"` (Optional):** Executes an expression on each incoming subscription message.

**Internal Logic:**

1.  **WebSocket Connection:** Internally, it would manage a WebSocket connection (potentially using the `data-websocket` plugin's logic or directly creating a `WebSocket` instance).
2.  **Protocol Handling:** It would implement a GraphQL-over-WebSocket protocol (e.g., `graphql-ws` or `subscriptions-transport-ws`) to send `connection_init`, `start`, `stop`, `connection_terminate` messages.
3.  **Message Parsing:** Parse incoming WebSocket messages as GraphQL subscription results.
4.  **Signal Updates:** Update the `result-signal` with new data and `error-signal` with any errors.

## 5. Integration with Other Nexus-UX Plugins

The GraphQL plugin is designed for natural integration with the existing Nexus-UX ecosystem:

*   **Signals (`data-signals`):**
    *   The `data-graphql` plugin automatically updates signals for query results (`$graphql.result`), loading states (`$graphql.loading`), and errors (`$graphql.error`).
    *   Variables can be sourced from other signals (e.g., `data-graphql-variables="{ id: $userId }"`).
*   **`data-on`:**
    *   Trigger GraphQL queries imperatively:
        ```html
        <button data-on-click="@graphql.execute('myQueryElementId');">
        ```
        (This would require a new `graphql.execute` action plugin, similar to `websocket.send`, that takes an element ID or selector to trigger its `executeGraphQL` function).
*   **`data-show` / `data-class`:**
    *   Conditionally display UI elements or apply styles based on loading/error states:
        ```html
        <div data-show="$isLoadingUserProfile">Loading user profile...</div>
        <div data-class="{ 'border-red-500': $userProfileErrors }"></div>
        ```
*   **`data-bind`:**
    *   Bind input fields to signals that are then used as GraphQL variables:
        ```html
        <input type="text" data-bind="searchQuery" />
        <div data-graphql="query { search(term: $searchQuery) { ... } }" data-graphql-variables="{ term: $searchQuery }" data-graphql-refetch-on-change="$searchQuery"></div>
        ```
*   **`data-effect`:**
    *   For debugging or complex side effects based on GraphQL responses:
        ```html
        <div data-effect="console.log('User data updated:', $userProfile)"></div>
        ```
*   **`data-component`:**
    *   Encapsulate GraphQL logic within reusable components:
        ```html
        <user-profile-card data-component="/components/user-profile.html" data-user-id="123"></user-profile-card>
        <!-- Inside user-profile.html -->
        <div data-graphql="query { user(id: $props.userId) { ... } }" data-graphql-variables="{ id: $props.userId }"></div>
        ```

## 6. Feature Completeness & Comparison

This proposed plugin aims for feature completeness comparable to client-side GraphQL libraries (e.g., Apollo Client, Urql, Relay) in a declarative, lightweight manner:

*   **Queries & Mutations:** Support for both data fetching and data modification.
*   **Variables:** Dynamic variable binding from signals.
*   **Loading & Error States:** Automatic tracking and exposure via signals.
*   **Refetching:** Declarative refetching on signal changes or polling.
*   **Subscriptions:** High-level support via a dedicated `data-graphql-subscription` plugin built on WebSockets.
*   **Caching:** (See Edge Cases) This initial spec does not include a sophisticated client-side cache like Apollo/Relay, but it's a critical future consideration.

**Comparison:**
*   **Lighter than Apollo/Relay:** Does not include a complex normalized cache or advanced features like optimistic UI out-of-the-box, keeping the bundle size small.
*   **More declarative than Urql/SWR:** Provides a direct HTML attribute interface, reducing JavaScript boilerplate.
*   **Leverages Nexus-UX's strengths:** Integrates seamlessly with the existing signal system and declarative attributes, making GraphQL consumption feel native to the framework.

## 7. Edge Cases & Advanced Considerations

*   **Network Errors vs. GraphQL Errors:** The plugin must clearly distinguish between network-level errors (e.g., 500 status code) and GraphQL-specific errors (returned in the `errors` array of a 200 OK response). Both should populate the `error-signal`.
*   **Authentication:** HTTP headers for authentication (e.g., `Authorization` token) can be passed via `data-graphql-headers`.
*   **Client-Side Caching:**
    *   **Initial Spec:** No built-in normalized cache. Results are stored in a signal.
    *   **Future:** For complex applications, a simple in-memory cache (e.g., based on query string + variables) could be added. A full normalized cache (like Apollo) would significantly increase complexity and bundle size, potentially going against Nexus-UX's lightweight philosophy.
*   **Batching Queries:** Sending multiple GraphQL queries in a single HTTP request. This could be a modifier (e.g., `data-graphql-batch="true"`) or a separate plugin.
*   **Persisted Queries:** Using a hash of the query instead of the full query string to reduce payload size. This would require server-side support.
*   **File Uploads:** GraphQL file uploads typically use `multipart/form-data`. The `fetcher` already supports this, but the GraphQL plugin would need to correctly format the request.
*   **Error Handling Granularity:** Allow more fine-grained control over how different types of GraphQL errors are handled (e.g., specific error codes).
*   **Loading Indicators:** The `loading-signal` is a basic indicator. More advanced patterns (e.g., global loading indicators) can be built using this signal.

## 8. Usage Examples

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus-UX GraphQL Demo</title>
    <script type="module" src="/bundles/nexus-ux.js"></script>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        .user-card { border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; border-radius: 8px; }
        .error-message { color: red; font-weight: bold; }
    </style>
</head>
<body>

    <h1>GraphQL User Profiles</h1>

    <div data-signals="{ currentUserId: 1, searchKeyword: '' }">

        <!-- User Profile Query -->
        <div
            data-graphql="query UserProfile($id: ID!) { user(id: $id) { name email posts { id title } } }"
            data-graphql-url="/api/graphql"
            data-graphql-variables="{ id: $currentUserId }"
            data-graphql-result-signal="userProfile"
            data-graphql-loading-signal="isLoadingUserProfile"
            data-graphql-error-signal="userProfileErrors"
            data-graphql-on-error="console.error('User Profile Fetch Error:', event.detail.errors || event.detail.error)"
            data-graphql-refetch-on-change="$currentUserId"
            class="user-card"
        >
            <p data-show="$isLoadingUserProfile">Loading user profile for ID <span data-text="$currentUserId"></span>...</p>
            <div data-show="!$isLoadingUserProfile && $userProfile">
                <h2>User: <span data-text="$userProfile.name"></span> (ID: <span data-text="$userProfile.id"></span>)</h2>
                <p>Email: <span data-text="$userProfile.email"></span></p>
                <h3>Posts:</h3>
                <ul data-show="$userProfile.posts.length > 0">
                    <template data-for="post in $userProfile.posts">
                        <li><span data-text="post.title"></span></li>
                    </template>
                </ul>
                <p data-show="$userProfile.posts.length === 0">No posts found.</p>
            </div>
            <div data-show="$userProfileErrors">
                <p class="error-message">Error fetching user profile:</p>
                <template data-for="error in $userProfileErrors">
                    <p class="error-message" data-text="error.message"></p>
                </template>
            </div>
        </div>

        <button data-on-click="$currentUserId = $currentUserId + 1">Next User</button>
        <button data-on-click="$currentUserId = $currentUserId - 1" data-show="$currentUserId > 1">Previous User</button>

        <hr style="margin: 20px 0;">

        <!-- Search Mutation Example -->
        <h2>Search Posts</h2>
        <input type="text" data-bind="searchKeyword" placeholder="Enter keyword..." />
        <button 
            data-on-click="
                @graphql.execute('searchPostsElement');
            "
            data-show="!$isLoadingSearch"
        >Search</button>
        <button data-show="$isLoadingSearch" disabled>Searching...</button>

        <div 
            id="searchPostsElement"
            data-graphql="mutation SearchPosts($term: String!) { searchPosts(term: $term) { id title } }"
            data-graphql-url="/api/graphql"
            data-graphql-variables="{ term: $searchKeyword }"
            data-graphql-result-signal="searchResults"
            data-graphql-loading-signal="isLoadingSearch"
            data-graphql-error-signal="searchErrors"
            data-graphql-on-success="console.log('Search results:', event.detail.data)"
            data-graphql-on-error="console.error('Search error:', event.detail.errors || event.detail.error)"
            data-graphql-method="POST"
            data-graphql-refetch-on-change="$searchKeyword"
            data-show="false" <!-- Hidden, triggered by button click -->
        ></div>

        <div data-show="!$isLoadingSearch && $searchResults">
            <h3>Results for "<span data-text="$searchKeyword"></span>":</h3>
            <ul data-show="$searchResults.searchPosts.length > 0">
                <template data-for="post in $searchResults.searchPosts">
                    <li><span data-text="post.title"></span> (ID: <span data-text="post.id"></span>)</li>
                </template>
            </ul>
            <p data-show="$searchResults.searchPosts.length === 0">No posts found for this keyword.</p>
        </div>
        <div data-show="$searchErrors">
            <p class="error-message">Error during search:</p>
            <template data-for="error in $searchErrors">
                <p class="error-message" data-text="error.message"></p>
            </template>
        </div>

    </div>

</body>
</html>
```

## 9. Conclusion

This detailed proposal outlines a robust, declarative, and idiomatic GraphQL plugin for Nexus-UX. By leveraging the framework's existing reactive and plugin-based architecture, it provides a powerful tool for consuming GraphQL APIs, further enhancing Nexus-UX's capabilities and competitive standing in the modern web development landscape.