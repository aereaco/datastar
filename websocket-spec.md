# WebSocket Plugin Specification for Nexus-UX

## 1. Introduction & Motivation

The current Nexus-UX framework excels at server-driven UI updates via HTML fragments and signal patching over HTTP/SSE. However, for truly real-time, bidirectional communication, WebSockets are the superior protocol. Implementing native WebSocket support will:

*   **Enable Real-time Features:** Live chat, collaborative editing, real-time dashboards, notifications, game states.
*   **Improve Efficiency:** Reduce latency and overhead compared to polling or frequent SSE connections for bidirectional needs.
*   **Enhance Developer Experience (DX):** Provide a declarative, Nexus-UX-idiomatic way to manage WebSocket connections, abstracting away the complexities of the native WebSocket API.
*   **Strengthen Competitive Position:** Offer a complete suite of communication protocols, making Nexus-UX a more versatile choice for modern web applications.

## 2. Core Design Principles

The WebSocket plugin will adhere to Nexus-UX's core design principles:

*   **Declarative:** Primarily driven by `data-*` attributes on HTML elements.
*   **Reactive:** Connection status, incoming messages, and outgoing messages will be managed via Nexus-UX signals.
*   **Plugin-based:** Implemented as a standard Nexus-UX attribute plugin and an action plugin.
*   **Idiomatic:** Seamlessly integrates with existing `data-on`, `data-show`, `data-class`, `data-bind`, and other plugins.
*   **Robust:** Handles common edge cases like disconnections, errors, and automatic reconnection.

## 3. Proposed `data-websocket` Attribute Plugin

This will be the primary interface for managing WebSocket connections. It will be an `AttributePlugin`.

*   **Name:** `websocket`
*   **Attribute:** `data-websocket`

### 3.1. Attributes & Modifiers

The `data-websocket` attribute will be placed on an element (e.g., a `div`, `body`, or a custom component) and its value will be the WebSocket URL.

```html
<div data-websocket="wss://echo.websocket.events"></div>
```

**Key Attributes/Modifiers:**

*   **`data-websocket="<url>"` (Required):** The WebSocket server URL. This can be a direct string literal (e.g., `wss://echo.websocket.events`) or a JavaScript expression that evaluates to a string (e.g., `"$wsUrl"` or `"'wss://' + $host + '/ws'"`).
*   **`data-websocket-signals="<json_object>"` (Optional):** A JSON object defining the names of signals to be created/updated by the plugin.
    *   `status`: (String) Signal for connection status (`'connecting'`, `'open'`, `'closing'`, `'closed'`, `'error'`). Default: `ws.status`.
    *   `message`: (Any) Signal for the last received message data. Default: `ws.message`.
    *   `error`: (Object) Signal for the last error object. Default: `ws.error`.
    *   `instance`: (WebSocket) Signal to store the actual WebSocket instance. Default: `ws.instance`.
    *   `sendQueue`: (Array) Signal to queue messages when disconnected. Default: `ws.sendQueue`.
    *   **Example:** `data-websocket-signals="{ status: 'chatStatus', lastMsg: 'chatMessage' }"`
*   **`data-websocket-protocols="<json_array>"` (Optional):** A JSON array of sub-protocols to request (e.g., `["json", "xml"]`).
*   **`data-websocket-reconnect-interval="<ms>"` (Optional):** Milliseconds to wait before attempting to reconnect after a disconnection. Default: `3000`.
*   **`data-websocket-reconnect-max-attempts="<number>"` (Optional):** Maximum number of reconnection attempts. Default: `Infinity`.
*   **`data-websocket-reconnect-backoff="<factor>"` (Optional):** Factor for exponential backoff (e.g., `2` for doubling the interval). Default: `1` (linear).
*   **`data-websocket-binary-type="<type>"` (Optional):** Sets the `binaryType` of the WebSocket (`'blob'` or `'arraybuffer'`). Default: `'blob'`.
*   **`data-websocket-on-open="<expression>"` (Optional):** Executes an expression when the WebSocket connection is successfully opened. `event` context available.
*   **`data-websocket-on-message="<expression>"` (Optional):** Executes an expression when a message is received. `event` context available (e.g., `event.data`).
*   **`data-websocket-on-close="<expression>"` (Optional):** Executes an expression when the WebSocket connection is closed. `event` context available.
*   **`data-websocket-on-error="<expression>"` (Optional):** Executes an expression when an error occurs. `event` context available.
*   **`data-websocket-send-on-change="<signal_path>"` (Optional):** Automatically sends the value of the specified signal whenever it changes.
    *   **Example:** `data-websocket-send-on-change="$outgoingMessage"`

### 3.2. `onLoad` Logic (`AttributePlugin.onLoad`)

The `onLoad` method will handle the core logic for the `data-websocket` plugin.

```typescript
// library/src/plugins/official/browser/attributes/websocket.ts

import { AttributePlugin, PluginType, Requirement, RuntimeContext, CleanupUpdateCallback, MutationUpdateCallback } from '../../../../engine/types';
import { jsStrToObject } from '../../../../utils/text';
import { effect } from '../../../../vendored/preact-core';

// Internal map to store WebSocket instances by element ID
const wsInstances = new Map<string, WebSocket>();
const reconnectTimers = new Map<string, number>();
const reconnectAttempts = new Map<string, number>();

export const WebSocketPlugin: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'websocket',
  keyReq: Requirement.Denied, // No key like data-websocket:foo
  valReq: Requirement.Must,   // URL is required

  onLoad: (ctx: RuntimeContext) => {
    const { el, value: wsUrl, signals, effect, runtimeErr, genRX } = ctx;
    const elId = el.id || (el.id = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

    // Parse signals configuration
    const signalConfig = jsStrToObject(el.getAttribute('data-websocket-signals') || '{}');
    const statusSignalPath = signalConfig.status || 'ws.status';
    const messageSignalPath = signalConfig.message || 'ws.message';
    const errorSignalPath = signalConfig.error || 'ws.error';
    const instanceSignalPath = signalConfig.instance || 'ws.instance';
    const sendQueueSignalPath = signalConfig.sendQueue || 'ws.sendQueue';

    // Initialize signals
    signals.upsertIfMissing(statusSignalPath, 'connecting');
    signals.upsertIfMissing(messageSignalPath, null);
    signals.upsertIfMissing(errorSignalPath, null);
    signals.upsertIfMissing(instanceSignalPath, null);
    signals.upsertIfMissing(sendQueueSignalPath, []); // For queuing messages when disconnected

    // Parse optional attributes/modifiers
    const protocols = jsStrToObject(el.getAttribute('data-websocket-protocols') || '[]');
    const reconnectInterval = parseInt(el.getAttribute('data-websocket-reconnect-interval') || '3000', 10);
    const reconnectMaxAttempts = parseInt(el.getAttribute('data-websocket-reconnect-max-attempts') || 'Infinity', 10);
    const reconnectBackoff = parseFloat(el.getAttribute('data-websocket-reconnect-backoff') || '1');
    const binaryType = el.getAttribute('data-websocket-binary-type') || 'blob';

    const onOpenExpr = el.getAttribute('data-websocket-on-open');
    const onMessageExpr = el.getAttribute('data-websocket-on-message');
    const onCloseExpr = el.getAttribute('data-websocket-on-close');
    const onErrorExpr = el.getAttribute('data-websocket-on-error');

    let ws: WebSocket | null = null;
    let currentReconnectInterval = reconnectInterval;

    const connect = (url: string, attempt = 0) => {
      if (wsInstances.has(elId) && wsInstances.get(elId)?.readyState === WebSocket.OPEN) {
        return; // Already connected
      }

      signals.setValue(statusSignalPath, 'connecting');
      signals.setValue(errorSignalPath, null);
      reconnectAttempts.set(elId, attempt);
      clearTimeout(reconnectTimers.get(elId)!);

      try {
        ws = new WebSocket(url, protocols);
        ws.binaryType = binaryType as BinaryType;
        wsInstances.set(elId, ws);
        signals.setValue(instanceSignalPath, ws);

        ws.onopen = (event) => {
          signals.setValue(statusSignalPath, 'open');
          reconnectAttempts.set(elId, 0); // Reset attempts on successful connect
          currentReconnectInterval = reconnectInterval; // Reset interval
          // Send any queued messages
          const queue = signals.value(sendQueueSignalPath) as any[];
          queue.forEach(msg => ws?.send(msg));
          signals.setValue(sendQueueSignalPath, []); // Clear queue
          if (onOpenExpr) genRX()(onOpenExpr, { evt: event });
        };

        ws.onmessage = (event) => {
          signals.setValue(messageSignalPath, event.data);
          if (onMessageExpr) genRX()(onMessageExpr, { evt: event });
        };

        ws.onclose = (event) => {
          signals.setValue(statusSignalPath, 'closed');
          if (onCloseExpr) genRX()(onCloseExpr, { evt: event });
          
          // Reconnection logic
          const currentAttempt = reconnectAttempts.get(elId)!;
          if (currentAttempt < reconnectMaxAttempts) {
            const delay = currentReconnectInterval * Math.pow(reconnectBackoff, currentAttempt);
            console.warn(`[Nexus-UX WebSocket] Reconnecting in ${delay}ms (attempt ${currentAttempt + 1})...`);
            reconnectTimers.set(elId, setTimeout(() => connect(url, currentAttempt + 1), delay) as any);
          } else {
            console.error(`[Nexus-UX WebSocket] Max reconnection attempts reached for ${url}.`);
          }
        };

        ws.onerror = (event) => {
          signals.setValue(statusSignalPath, 'error');
          signals.setValue(errorSignalPath, { message: 'WebSocket Error', event });
          if (onErrorExpr) genRX()(onErrorExpr, { evt: event });
          ws?.close(); // Force close to trigger onclose and reconnection logic
        };

      } catch (e: any) {
        signals.setValue(statusSignalPath, 'error');
        signals.setValue(errorSignalPath, { message: e.message, error: e });
        runtimeErr('WebSocketConnectionFailed', ctx, { url, error: e.message });
        // Attempt reconnection even on initial connection failure
        const currentAttempt = reconnectAttempts.get(elId)!;
        if (currentAttempt < reconnectMaxAttempts) {
          const delay = currentReconnectInterval * Math.pow(reconnectBackoff, currentAttempt);
          console.warn(`[Nexus-UX WebSocket] Initial connection failed, retrying in ${delay}ms (attempt ${currentAttempt + 1})...`);
          reconnectTimers.set(elId, setTimeout(() => connect(url, currentAttempt + 1), delay) as any);
        }
      }
    };

    // Initial connection
    connect(wsUrl);

    // Auto-send on signal change
    const sendOnChangeSignalPath = el.getAttribute('data-websocket-send-on-change');
    let sendOnChangeEffectCleanup: CleanupUpdateCallback | undefined;
    if (sendOnChangeSignalPath) {
      sendOnChangeEffectCleanup = effect(() => {
        const dataToSend = signals.value(sendOnChangeSignalPath);
        if (dataToSend !== undefined && ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(dataToSend)); // Assume JSON for structured data
        } else if (dataToSend !== undefined && ws?.readyState !== WebSocket.OPEN) {
          // Queue message if not open
          const queue = signals.value(sendQueueSignalPath) as any[];
          signals.setValue(sendQueueSignalPath, [...queue, JSON.stringify(dataToSend)]);
        }
      });
    }

    const cleanupCallback: CleanupUpdateCallback = () => {
      ws?.close();
      wsInstances.delete(elId);
      reconnectAttempts.delete(elId);
      clearTimeout(reconnectTimers.get(elId)!);
      sendOnChangeEffectCleanup?.();
    };

    const mutationCallback: MutationUpdateCallback = (newUrl) => {
      // If URL changes, close old connection and establish new one
      if (newUrl && newUrl !== wsUrl) {
        ws?.close();
        connect(newUrl);
      }
      // Re-evaluate send-on-change if attribute changes
      if (sendOnChangeSignalPath) {
        sendOnChangeEffectCleanup?.(); // Re-run effect to pick up new signal path if it changed
      }
    };

    return { cleanupCallback, mutationCallback };
  },
};
```

## 4. Proposed `websocket.send` Action Plugin

This action plugin will allow imperative sending of messages.

*   **Name:** `websocket` (same as attribute plugin, but used as an action)
*   **Action:** `@websocket.send(<data_to_send>, <optional_element_selector>)`

```typescript
// library/src/plugins/official/logic/actions/websocket.ts

import { ActionPlugin, PluginType, RuntimeContext } from '../../../../engine/types';
import { WebSocketPlugin } from '../../browser/attributes/websocket'; // Import the attribute plugin for internal access

export const WebSocketSendAction: ActionPlugin = {
  type: PluginType.Action,
  name: 'websocket', // Same name as the attribute plugin
  fn: (ctx: RuntimeContext, dataToSend: any, selector?: string) => {
    const { el, runtimeErr, signals } = ctx;

    let targetEl: HTMLElement | null = el;
    if (selector) {
      targetEl = document.querySelector(selector);
      if (!targetEl) {
        throw runtimeErr('WebSocketTargetNotFound', ctx, { selector });
      }
    }

    const elId = targetEl?.id;
    if (!elId) {
      throw runtimeErr('WebSocketElementIdMissing', ctx, { element: targetEl });
    }

    const ws = wsInstances.get(elId);

    if (!ws) {
      throw runtimeErr('WebSocketNotInitialized', ctx, { element: targetEl });
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(dataToSend)); // Assume JSON for structured data
    } else {
      // Queue message if not open
      const sendQueueSignalPath = signals.signal('ws.sendQueue')?.path || 'ws.sendQueue'; // Default or configured path
      const queue = signals.value(sendQueueSignalPath) as any[];
      signals.setValue(sendQueueSignalPath, [...queue, JSON.stringify(dataToSend)]);
      console.warn(`[Nexus-UX WebSocket] Connection not open, message queued: ${JSON.stringify(dataToSend)}`);
    }
  },
};
```

## 5. Integration with Other Nexus-UX Plugins

The WebSocket plugin is designed for natural integration:

*   **Signals (`data-signals`):**
    *   The `data-websocket` plugin automatically updates signals for connection status (`$ws.status`), last message (`$ws.message`), and errors (`$ws.error`).
    *   You can define custom signal names using `data-websocket-signals`.
*   **`data-on`:**
    *   Use `data-on-click` on buttons to trigger the `@websocket.send` action.
    *   Use `data-websocket-on-open`, `data-websocket-on-message`, etc., to execute expressions when WebSocket events occur.
*   **`data-show`:**
    *   Conditionally display UI elements based on connection status:
        ```html
        <span data-show="$ws.status === 'connecting'">Connecting...</span>
        <span data-show="$ws.status === 'open'">Connected!</span>
        <span data-show="$ws.status === 'closed'">Disconnected.</span>
        <span data-show="$ws.status === 'error'">Connection Error!</span>
        ```
*   **`data-class`:**
    *   Apply CSS classes based on connection status for visual feedback:
        ```html
        <div data-class="{ 'border-green-500': $ws.status === 'open', 'border-red-500': $ws.status === 'error' }">
          WebSocket Status: <span data-text="$ws.status"></span>
        </div>
        ```
*   **`data-effect`:**
    *   For debugging or complex side effects based on WebSocket events:
        ```html
        <div data-effect="console.log('WS Status Changed:', $ws.status)"></div>
        ```
*   **`data-bind`:**
    *   Bind an input field to a signal, and then use `data-websocket-send-on-change` to automatically send its value:
        ```html
        <input type="text" data-bind="chatInput" data-websocket-send-on-change="$chatInput" />
        ```
*   **`data-component`:**
    *   Encapsulate WebSocket logic within reusable components:
        ```html
        <chat-component data-component="/components/chat.html" data-websocket="wss://chat.example.com/ws"></chat-component>
        ```

## 6. Feature Completeness & Comparison

This proposed plugin aims for feature completeness comparable to common WebSocket libraries/framework integrations:

*   **Connection Management:** Open, close, error handling.
*   **Connection Status:** Exposing `readyState` via signals.
*   **Automatic Reconnection:** Configurable intervals and exponential backoff.
*   **Message Sending:** Imperative send action, and declarative send-on-signal-change.
*   **Message Receiving:** Updating signals with incoming messages.
*   **Event Hooks:** `onopen`, `onmessage`, `onclose`, `onerror` expressions.
*   **Sub-protocols:** Support for specifying sub-protocols.
*   **Binary Data:** Support for `Blob` and `ArrayBuffer` types.
*   **Message Queuing:** Buffering messages when disconnected and sending upon reconnection.

**Comparison:**
*   **Similar to `vue-native-websocket` or `react-websocket`:** Provides declarative connection management and reactive data flow.
*   **Leverages Nexus-UX's strengths:** Integrates seamlessly with the existing signal system and declarative attributes, making it more "native" to the framework than a standalone library.

## 7. Edge Cases & Advanced Considerations

*   **Network Fluctuations:** The reconnection strategy (interval, max attempts, backoff) is crucial.
*   **Server-Side Disconnects:** The `onclose` event will handle server-initiated disconnects, triggering reconnection attempts.
*   **Message Queuing:** Messages sent while the connection is `connecting` or `closed` will be queued and sent once the connection is `open`. This prevents data loss during brief disconnections.
*   **Binary Data:** The `binaryType` attribute allows handling `Blob` or `ArrayBuffer` messages. Message parsing in `onmessage` would need to account for this (e.g., checking `event.data` type).
*   **Authentication/Authorization:**
    *   **Initial Handshake:** Authentication typically happens during the WebSocket handshake (e.g., via headers, query parameters, or cookies). The `data-websocket` URL can include query parameters for tokens.
    *   **Message-based Auth:** For subsequent authentication, messages can be sent over the WebSocket.
*   **Sub-protocols:** The `data-websocket-protocols` attribute allows specifying sub-protocols, which is important for server-side routing and message handling.
*   **Heartbeats/Pings:** For long-lived connections, implementing application-level heartbeats (ping/pong messages) might be necessary to keep the connection alive and detect dead connections faster than TCP timeouts. This could be an advanced modifier (e.g., `data-websocket-heartbeat-interval`).
*   **Multiple Connections:** The current design supports multiple `data-websocket` instances on different elements, each managing its own connection. Each instance would have its own set of signals (e.g., `$chatWs.status`, `$notificationWs.status`).
*   **Security (WSS):** Always recommend `wss://` for production environments to ensure encrypted communication.
*   **Message Serialization/Deserialization:** The plugin assumes `JSON.stringify` for sending and `event.data` for receiving. For complex data, developers might need to implement custom serialization/deserialization in their `onmessage` and `send` expressions.

## 8. Usage Examples

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus-UX WebSocket Demo</title>
    <script type="module" src="/bundles/nexus-ux.js"></script>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        .status-indicator { padding: 5px 10px; border-radius: 5px; display: inline-block; }
        .status-connecting { background-color: orange; color: white; }
        .status-open { background-color: green; color: white; }
        .status-closed { background-color: gray; color: white; }
        .status-error { background-color: red; color: white; }
        #messages { border: 1px solid #ccc; padding: 10px; min-height: 150px; overflow-y: auto; margin-top: 10px; }
        .message-input { margin-top: 10px; }
    </style>
</head>
<body>

    <h1>WebSocket Chat Demo</h1>

    <div 
        id="chat-ws-container"
        data-websocket="wss://echo.websocket.events"
        data-websocket-signals="{ status: 'chat.status', message: 'chat.lastMessage', instance: 'chat.wsInstance', sendQueue: 'chat.sendQueue' }"
        data-websocket-on-open="console.log('Chat WS Opened!'); $chat.messages = [...$chat.messages, { type: 'system', text: 'Connected to chat!' }]"
        data-websocket-on-message="
            const msg = JSON.parse(event.data);
            $chat.messages = [...$chat.messages, msg];
            console.log('Received chat message:', msg);
        "
        data-websocket-on-close="console.log('Chat WS Closed!'); $chat.messages = [...$chat.messages, { type: 'system', text: 'Disconnected from chat.' }]"
        data-websocket-on-error="console.error('Chat WS Error!'); $chat.messages = [...$chat.messages, { type: 'system', text: 'Chat connection error!' }]"
        data-websocket-reconnect-interval="2000"
        data-websocket-reconnect-max-attempts="5"
        data-signals="{ chat: { messages: [], currentMessage: '' } }"
    >
        <h2>Chat Status: 
            <span 
                data-text="$chat.status" 
                data-class="{ 
                    'status-connecting': $chat.status === 'connecting',
                    'status-open': $chat.status === 'open',
                    'status-closed': $chat.status === 'closed',
                    'status-error': $chat.status === 'error' 
                }"
                class="status-indicator"
            ></span>
        </h2>

        <div id="messages">
            <template data-for="msg in $chat.messages">
                <p>
                    <span data-text="msg.type === 'user' ? 'You: ' : 'System: '"></span>
                    <span data-text="msg.text"></span>
                </p>
            </template>
        </div>

        <div class="message-input">
            <input 
                type="text" 
                data-bind="chat.currentMessage" 
                placeholder="Type your message..." 
                data-on-keydown-enter="
                    if ($chat.currentMessage.length > 0) {
                        @websocket.send(JSON.stringify({ type: 'user', text: $chat.currentMessage }));
                        $chat.currentMessage = '';
                    }
                "
            />
            <button 
                data-on-click="
                    if ($chat.currentMessage.length > 0) {
                        @websocket.send(JSON.stringify({ type: 'user', text: $chat.currentMessage }));
                        $chat.currentMessage = '';
                    }
                "
                data-show="$chat.status === 'open'"
            >Send</button>
            <button data-show="$chat.status !== 'open'" disabled>Connect to Send</button>
        </div>
        <p data-show="$chat.sendQueue.length > 0">Messages in queue: <span data-text="$chat.sendQueue.length"></span></p>
    </div>

</body>
</html>
```

---

## 9. Conclusion

This detailed proposal outlines a robust, declarative, and idiomatic WebSocket plugin for Nexus-UX. By leveraging the framework's existing reactive and plugin-based architecture, it provides a powerful tool for building real-time applications, further enhancing Nexus-UX's capabilities and competitive standing in the modern web development landscape.

---
