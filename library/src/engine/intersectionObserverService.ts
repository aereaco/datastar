import { HTMLorSVGElement } from './types';

export type IntersectionDispatchCallback = (
  element: HTMLorSVGElement,
  entry: IntersectionObserverEntry,
) => void;

export class IntersectionObserverService {
  private observer: IntersectionObserver;
  private dispatchCallback: IntersectionDispatchCallback;

  constructor(dispatchCallback: IntersectionDispatchCallback, options?: IntersectionObserverInit) {
    this.dispatchCallback = dispatchCallback;
    this.observer = new IntersectionObserver(this.handleIntersections.bind(this), options);
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

  private handleIntersections(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      if (entry.target instanceof HTMLElement || entry.target instanceof SVGElement) {
        this.dispatchCallback(entry.target, entry);
      }
    }
  }
}
