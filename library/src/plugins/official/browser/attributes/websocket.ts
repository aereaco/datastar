import { AttributePlugin, PluginType, Requirement, RuntimeContext, CleanupUpdateCallback, MutationUpdateCallback } from '../../../../engine/types';
import { jsStrToObject } from '../../../../utils/text';

// Internal map to store WebSocket instances by element ID
const wsInstances = new Map<string, WebSocket>();
const reconnectTimers = new Map<string, number>();
const reconnectAttempts = new Map<string, number>();

export const WebSocketPlugin: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'websocket',
  keyReq: Requirement.Denied, // No key like data-websocket:foo
  valReq: Requirement.Must,   // URL is required
  argNames: ['event'], // Add this line

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
          if (onOpenExpr) genRX()(event); // Change this
        };

        ws.onmessage = (event) => {
          signals.setValue(messageSignalPath, event.data);
          if (onMessageExpr) genRX()(event); // Change this
        };

        ws.onclose = (event) => {
          signals.setValue(statusSignalPath, 'closed');
          if (onCloseExpr) genRX()(event); // Change this
          
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
          if (onErrorExpr) genRX()(event); // Change this
          ws?.close(); // Force close to trigger onclose and reconnection logic
        };

      } catch (e: any) {
        signals.setValue(statusSignalPath, 'error');
        signals.setValue(errorSignalPath, { message: e.message, error: e });
        runtimeErr('WebSocketConnectionFailed', { url, error: e.message }); // Change this
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