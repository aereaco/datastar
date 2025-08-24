import { ActionPlugin, PluginType, RuntimeContext, HTMLorSVGElement } from '../../../engine/types';
// Import the attribute plugin for internal access
import { WebSocketPlugin } from '../../browser/attributes/websocket'; 

// This is a global map that needs to be accessible by both the attribute and action plugins.
// It's defined in the attribute plugin's file, so we need to import it.
// @ts-ignore
const wsInstances = WebSocketPlugin.wsInstances; // Assuming wsInstances is exported from WebSocketPlugin.ts

export const WebSocketSendAction: ActionPlugin = {
  type: PluginType.Action,
  name: 'websocket', // Same name as the attribute plugin
  fn: (ctx: RuntimeContext, dataToSend: any, selector?: string) => {
    const { el, runtimeErr, signals } = ctx;

    let targetEl: HTMLorSVGElement | null = el;
    if (selector) {
      targetEl = document.querySelector(selector);
      if (!targetEl) {
        throw runtimeErr('WebSocketTargetNotFound', { selector });
      }
    }

    const elId = targetEl?.id;
    if (!elId) {
      throw runtimeErr('WebSocketElementIdMissing', { element: targetEl });
    }

    const ws = wsInstances.get(elId);

    if (!ws) {
      throw runtimeErr('WebSocketNotInitialized', { element: targetEl });
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(dataToSend)); // Assume JSON for structured data
    } else {
      // Queue message if not open
      const sendQueueSignalPath = 'ws.sendQueue'; // Default or configured path
      const queue = signals.value(sendQueueSignalPath) as any[];
      signals.setValue(sendQueueSignalPath, [...queue, JSON.stringify(dataToSend)]);
      console.warn(`[Nexus-UX WebSocket] Connection not open, message queued: ${JSON.stringify(dataToSend)}`);
    }
  },
};