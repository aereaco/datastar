import { HTMLorSVGElement, AttributePlugin } from './types';

// Define a type for the dispatch callback that the engine will provide
export type MutationDispatchCallback = (
  element: HTMLorSVGElement,
  attributeName: string,
  newValue: string | null,
  plugin?: AttributePlugin // Plugin is optional as it might be an elementAdded/Removed event
) => void;

export class MutationObserverService { // Renamed class
  private observer: MutationObserver;
  private dispatchCallback: MutationDispatchCallback; // Store the engine's dispatch callback

  // Constructor now accepts the engine's dispatch callback
  constructor(dispatchCallback: MutationDispatchCallback) {
    this.dispatchCallback = dispatchCallback;
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  /**
   * Starts observing the given root element for DOM changes.
   * @param root The root element to observe (e.g., document.body).
   */
  public startObserving(root: HTMLorSVGElement) {
    this.observer.observe(root, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  /**
   * Stops observing DOM changes.
   */
  public stopObserving() {
    this.observer.disconnect();
  }

  /**
   * Handles the mutations observed by the MutationObserver.
   * This method now dispatches relevant mutations to the engine's callback.
   * @param mutations The list of mutations.
   */
  private handleMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case 'attributes':
          // If an attribute changed, dispatch it to the engine
          if (mutation.target instanceof HTMLElement || mutation.target instanceof SVGElement) {
            const element = mutation.target;
            const attributeName = mutation.attributeName!; // attributeName is guaranteed for 'attributes' type
            const newValue = element.getAttribute(attributeName);
            // Dispatch to the engine's callback. The engine will look up the plugin.
            this.dispatchCallback(element, attributeName, newValue);
          }
          break;
        case 'childList':
          // When nodes are added or removed, inform the engine
          mutation.removedNodes.forEach(node => {
            if (node instanceof HTMLElement || node instanceof SVGElement) {
              // Inform the engine about removed elements for cleanup
              this.dispatchCallback(node, 'elementRemoved', null);
            }
          });
          mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLElement || node instanceof SVGElement) {
              // Inform the engine about added elements for initial plugin application
              this.dispatchCallback(node, 'elementAdded', null);
            }
          });
          break;
      }
    }
  }
}
