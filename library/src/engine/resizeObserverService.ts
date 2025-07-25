import { HTMLorSVGElement } from './types';

export type ResizeDispatchCallback = (
  element: HTMLorSVGElement,
  entry: ResizeObserverEntry,
) => void;

export class ResizeObserverService {
  private observer: ResizeObserver;
  private dispatchCallback: ResizeDispatchCallback;

  constructor(dispatchCallback: ResizeDispatchCallback) {
    this.dispatchCallback = dispatchCallback;
    this.observer = new ResizeObserver(this.handleResizes.bind(this));
  }

  public observe(element: HTMLorSVGElement) {
    this.observer.observe(element);
  }

  public unobserve(element: HTMLorSVGElement) {
    this.observer.unobserve(element);
  }

  public disconnect() {
    this.observer.disconnect();
  }

  private handleResizes(entries: ResizeObserverEntry[]) {
    for (const entry of entries) {
      if (entry.target instanceof HTMLElement || entry.target instanceof SVGElement) {
        this.dispatchCallback(entry.target, entry);
      }
    }
  }
}
