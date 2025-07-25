import { HTMLorSVGElement } from './types';

export type PerformanceDispatchCallback = (
  element: HTMLorSVGElement,
  entry: PerformanceObserverEntryList,
) => void;

export class PerformanceObserverService {
  private observer: PerformanceObserver;
  private dispatchCallback: PerformanceDispatchCallback;

  constructor(dispatchCallback: PerformanceDispatchCallback, entryTypes: string[]) {
    this.dispatchCallback = dispatchCallback;
    this.observer = new PerformanceObserver(this.handlePerformanceEntries.bind(this));
    this.observer.observe({ entryTypes });
  }

  public disconnect() {
    this.observer.disconnect();
  }

  private handlePerformanceEntries(entries: PerformanceObserverEntryList) {
    // PerformanceObserver entries are not directly tied to a single element
    // We'll need to dispatch the entries and let the engine determine relevance
    this.dispatchCallback(document.documentElement, entries); // Dispatch to document.documentElement or a more appropriate global element
  }
}