import { PluginType, type WatcherPlugin } from '../../../engine/types';

export const ROUTER_POPSTATE_EVENT = 'router:popstate';

export interface RouterPopstateEvent {
  url: string;
  state: any;
}

export interface CustomEventMap {
    [ROUTER_POPSTATE_EVENT]: CustomEvent<RouterPopstateEvent>
}

declare global {
    interface Document {
      dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): void
      addEventListener<K extends keyof CustomEventMap>(type: K, listener: (this: Document, ev: CustomEventMap[K]) => void,): void
      removeEventListener<K extends keyof CustomEventMap>(type: K, listener: (this: Document, ev: CustomEventMap[K]) => void,): void
    }
  }

export function pushState(url: string, data: any = {}) {
    window.history.pushState(data, '', url);
}

export function replaceState(url: string, data: any = {}) {
    window.history.replaceState(data, '', url);
}

export const History: WatcherPlugin = {
    type: PluginType.Watcher,
    name: 'history',

    onGlobalInit() {
        window.addEventListener('popstate', (event) => {
            const popstateEvent = new CustomEvent<RouterPopstateEvent>(ROUTER_POPSTATE_EVENT, {
                detail: {
                    url: window.location.href,
                    state: event.state,
                }
            });
            document.dispatchEvent(popstateEvent);
        });
    }
};
