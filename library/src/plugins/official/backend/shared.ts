import { STATE } from '../../../engine/consts'
import type { HTMLorSVGElement } from '../../../engine/types'

export const STATE_FETCH_EVENT = `${STATE}-fetch`
export const STARTED = 'started'
export const FINISHED = 'finished'
export const ERROR = 'error'
export const RETRYING = 'retrying'
export const RETRIES_FAILED = 'retrying'

export interface StateFetchEvent {
  type: string
  el: HTMLorSVGElement
  argsRaw: Record<string, string>
}

export interface CustomEventMap {
  [STATE_FETCH_EVENT]: CustomEvent<StateFetchEvent>
}
export type WatcherFn<K extends keyof CustomEventMap> = (
  this: Document,
  ev: CustomEventMap[K],
) => void

declare global {
  interface Document {
    //adds definition to Document, but you can do the same with HTMLElement
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: WatcherFn<K>,
    ): void
    removeEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: WatcherFn<K>,
    ): void
    dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): void
  }
}

export function stateSSEEventWatcher(
  eventType: string,
  fn: (argsRaw: Record<string, string>) => void,
) {
  document.addEventListener(
    STATE_FETCH_EVENT,
    (event: CustomEvent<StateFetchEvent>) => {
      if (event.detail.type !== eventType) return
      const { argsRaw } = event.detail
      fn(argsRaw)
    },
  )
}

export function dispatchFetch(
  type: string,
  el: HTMLorSVGElement,
  argsRaw: Record<string, string>,
) {
  document.dispatchEvent(
    new CustomEvent<StateFetchEvent>(STATE_FETCH_EVENT, {
      detail: { type, el, argsRaw },
    }),
  )
}