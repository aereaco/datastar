import type { EffectFn, Signal } from '../vendored/preact-core'
import { STATE } from './consts'
import type { SignalsRoot } from './signals'

export type CleanupUpdateCallback = () => void
export type MutationUpdateCallback = (newValue: string | null) => void
export type ResizeUpdateCallback = (entry: ResizeObserverEntry) => void
export type IntersectionUpdateCallback = (entry: IntersectionObserverEntry) => void
export type PerformanceUpdateCallback = (element: HTMLorSVGElement, entry: PerformanceObserverEntryList) => void

export enum PluginType {
  Attribute = 1,
  Watcher = 2,
  Action = 3,
}

export interface StatePlugin {
  type: PluginType // The type of plugin
  name: string // The name of the plugin
}

export enum Requirement {
  Allowed = 0,
  Must = 1,
  Denied = 2,
  Exclusive = 3,
}

export interface StateSignalEvent {
  added: Array<string>
  removed: Array<string>
  updated: Array<string>
}
export const STATE_SIGNAL_EVENT = `${STATE}-signals`
export interface CustomEventMap {
  [STATE_SIGNAL_EVENT]: CustomEvent<StateSignalEvent>
}
export type WatcherFn<K extends keyof CustomEventMap> = (
  this: Document,
  ev: CustomEventMap[K],
) => void
declare global {
  interface Document {
    dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): void
    addEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: WatcherFn<K>,
    ): void
    removeEventListener<K extends keyof CustomEventMap>(
      type: K,
      listener: WatcherFn<K>,
    ): void
  }
}

// A plugin accesible via a `data-${name}` attribute on an element
export interface AttributePlugin extends StatePlugin {
  type: PluginType.Attribute
  onGlobalInit?: (ctx: InitContext) => void // Called once on registration of the plugin
  onLoad: (ctx: RuntimeContext) => {
    cleanupCallback?: CleanupUpdateCallback;
    mutationCallback?: MutationUpdateCallback;
    resizeCallback?: ResizeUpdateCallback;
    intersectionCallback?: IntersectionUpdateCallback;
    performanceCallback?: PerformanceUpdateCallback;
  } | CleanupUpdateCallback | void // Return a function to be called on removal
  keyReq?: Requirement // The rules for the key requirements
  valReq?: Requirement // The rules for the value requirements
  argNames?: string[] // argument names for the reactive expression
  affectsDOM?: boolean; // NEW: Indicates if the plugin directly manipulates the DOM visually
  observesResize?: boolean; // NEW: Indicates if the plugin needs to observe resize events
  observesIntersection?: boolean; // NEW: Indicates if the plugin needs to observe intersection events
  observesPerformance?: boolean; // NEW: Indicates if the plugin needs to observe performance events
}

// A plugin that runs on the global scope of the Nexus-UX instance
export interface WatcherPlugin extends StatePlugin {
  type: PluginType.Watcher
  onGlobalInit?: (ctx: InitContext) => void
}

export type ActionPlugins = Record<string, ActionPlugin>
export type ActionMethod = (ctx: RuntimeContext, ...args: any[]) => any

export interface ActionPlugin extends StatePlugin {
  type: PluginType
  fn: ActionMethod
}

export type GlobalInitializer = (ctx: InitContext) => void

export type InitContext = {
  plugin: StatePlugin
  signals: SignalsRoot
  effect: (fn: EffectFn) => CleanupUpdateCallback
  actions: Readonly<ActionPlugins>
  removals: Map<string, Map<number, CleanupUpdateCallback>>
  applyToElement: (el: HTMLorSVGElement) => void
}

export type HTMLorSVGElement = Element & (HTMLElement | SVGElement)
export type Modifiers = Map<string, Set<string>> // mod name -> tags

export type RuntimeContext = InitContext & {
  plugin: StatePlugin // The name of the plugin
  el: HTMLorSVGElement // The element the attribute is on
  rawKey: Readonly<string> // no parsing data-* key
  key: Readonly<string> // data-* key without the prefix or tags
  value: Readonly<string> // value of data-* attribute
  mods: Modifiers // the tags and their arguments
  genRX: () => <T>(...args: any[]) => T // a reactive expression
  rx: <T = any>(...args: any[]) => T // a reactive expression
  fnContent?: string // the content of the function
  evt?: Event // The event that triggered the action
  runtimeErr: (reason: string, metadata?: object) => Error // runtimeErr is a method
  filtered: (opts?: SignalFilterOptions | undefined, obj?: NestedValues | undefined) => NestedValues // filtered is a method
  untracked: <T>(fn: () => T) => T // untracked is a method
}

export type SignalFilterOptions = {
  include?: RegExp
  exclude?: RegExp
}



export type Computed<T = any> = () => T

export type Effect = () => void



export type NestedValues = { [key: string]: NestedValues | any }
export type NestedSignal = { [key: string]: NestedSignal | Signal<any>
}

export type RuntimeExpressionFunction = (
  ctx: RuntimeContext,
  ...args: any[]
) => any

export type EventCallbackHandler = (...args: any[]) => void