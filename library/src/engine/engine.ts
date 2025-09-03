import { Hash, attrHash, elUniqId, walkDOM } from '../utils/dom'
import { camel } from '../utils/text'
import { effect, untracked } from '../vendored/preact-core'
import { DSP, DSS } from './consts'
import { closestDataStack, mergeProxies } from './scope'
import { initErr, runtimeErr } from './errors'
import { SignalsRoot, type SignalFilterOptions } from './signals'
import {
  type ActionPlugin,
  type ActionPlugins,
  type AttributePlugin,
  type StatePlugin,
  type GlobalInitializer,
  type HTMLorSVGElement,
  type InitContext,
  type CleanupUpdateCallback,
  type MutationUpdateCallback,
  type ResizeUpdateCallback,
  type IntersectionUpdateCallback,
  type PerformanceUpdateCallback,
  type NestedValues,
  PluginType,
  Requirement,
  type RuntimeContext,
  type RuntimeExpressionFunction,
  type WatcherPlugin,
} from './types'

const signals: SignalsRoot = new SignalsRoot()
const actions: ActionPlugins = {}
const plugins: AttributePlugin[] = []

// Map of attribute update callbacks by element and attribute name
const attributeOwnership = new Map<Element, Map<string, MutationUpdateCallback>>()

// Map of resize update callbacks by element and plugin name
const resizeOwnership = new Map<Element, Map<string, ResizeUpdateCallback>>()

// Map of intersection update callbacks by element and plugin name
const intersectionOwnership = new Map<Element, Map<string, IntersectionUpdateCallback>>()

// Map of performance update callbacks by element and plugin name
const performanceOwnership = new Map<Element, Map<string, PerformanceUpdateCallback>>()

// Map of cleanup functions by element ID, keyed by a dataset key-value hash
const removals = new Map<string, Map<number, CleanupUpdateCallback>>()

import { MutationObserverService } from './mutationObserverService';
import { ResizeObserverService } from './resizeObserverService';
import { IntersectionObserverService } from './intersectionObserverService';
import { PerformanceObserverService } from './performanceObserverService';

let mutationObserverService: MutationObserverService | null = null;
let resizeObserverService: ResizeObserverService | null = null;
let intersectionObserverService: IntersectionObserverService | null = null;
let performanceObserverService: PerformanceObserverService | null = null;

let alias = ''
export function setAlias(value: string) {
  alias = value
}

export function load(...pluginsToLoad: StatePlugin[]) {
  for (const plugin of pluginsToLoad) {
    const ctx: InitContext = {
      plugin,
      signals,
      effect: (cb: () => void): CleanupUpdateCallback => effect(cb),
      actions,
      removals,
      applyToElement,
    }

    let globalInitializer: GlobalInitializer | undefined
    switch (plugin.type) {
      case PluginType.Action: {
        actions[plugin.name] = plugin as ActionPlugin
        break
      }
      case PluginType.Attribute: {
        const ap = plugin as AttributePlugin
        plugins.push(ap)
        globalInitializer = ap.onGlobalInit
        break
      }
      case PluginType.Watcher: {
        const wp = plugin as WatcherPlugin
        globalInitializer = wp.onGlobalInit
        break
      }
      default: {
        throw initErr('InvalidPluginType', ctx)
      }
    }
    if (globalInitializer) {
      globalInitializer(ctx)
    }
  }

  // Sort attribute plugins by descending length then alphabetically
  plugins.sort((a, b) => {
    const lenDiff = b.name.length - a.name.length
    if (lenDiff !== 0) return lenDiff
    return a.name.localeCompare(b.name)
  })
}

// Apply all plugins to all elements in the DOM
export function apply() {
  // Delay applying plugins to give custom plugins a chance to load
  queueMicrotask(() => {
    applyToElement(document.documentElement)
    if (!mutationObserverService) {
      mutationObserverService = new MutationObserverService(handleMutation);
      mutationObserverService.startObserving(document.body);
    }
  })
}

// Apply all plugins to the element and its children
function applyToElement(rootElement: HTMLorSVGElement) {
  walkDOM(rootElement, (el) => {
    // Check if the element has any data attributes already
    const toApply = new Array<string>()
    const elCleanups = removals.get(el.id) || new Map()
    const toCleanup = new Map<number, CleanupUpdateCallback>([...elCleanups])
    const hashes = new Map<string, number>()

    // Apply the plugins to the element in order of application
    // since DOMStringMap is ordered, we can be deterministic
    for (const datasetKey of Object.keys(el.dataset)) {
      // Ignore data attributes that don’t start with the alias
      if (!datasetKey.startsWith(alias)) {
        break
      }

      const datasetValue = el.dataset[datasetKey] || ''
      const currentHash = attrHash(datasetKey, datasetValue)
      hashes.set(datasetKey, currentHash)

      // If the hash hasn't changed, ignore
      // otherwise keep the old cleanup and add new to applys
      if (elCleanups.has(currentHash)) {
        toCleanup.delete(currentHash)
      } else {
        toApply.push(datasetKey)
      }
    }

    // Clean up any old plugins and apply the new ones
    for (const [_, cleanup] of toCleanup) {
      cleanup()
    }
    for (const key of toApply) {
      const h = hashes.get(key)!
      applyAttributePlugin(el, key, h)
    }
  })
}

function handleMutation(
  element: HTMLorSVGElement,
  attributeName: string,
  newValue: string | null,
) {
  if (attributeName === 'elementRemoved') {
    const elTracking = removals.get(element.id)
    if (elTracking) {
      for (const [hash, cleanup] of elTracking) {
        cleanup()
        elTracking.delete(hash)
      }
      if (elTracking.size === 0) {
        removals.delete(element.id)
      }
    }
    // Remove from attribute ownership map
    attributeOwnership.delete(element)
    resizeOwnership.delete(element)
    intersectionOwnership.delete(element)
    performanceOwnership.delete(element)
    if (resizeObserverService) {
      resizeObserverService.unobserve(element);
    }
    if (intersectionObserverService) {
      intersectionObserverService.unobserve(element);
    }
  } else if (attributeName === 'elementAdded') {
    applyToElement(element)
  } else {
    const elAttributeOwnership = attributeOwnership.get(element)
    if (elAttributeOwnership) {
      const mutationCallback = elAttributeOwnership.get(attributeName)
      if (mutationCallback) {
        mutationCallback(newValue)
      }
    }
  }
}

function handleResize(
  element: HTMLorSVGElement,
  entry: ResizeObserverEntry,
) {
  const elResizeOwnership = resizeOwnership.get(element)
  if (elResizeOwnership) {
    for (const [_, resizeCallback] of elResizeOwnership) {
      resizeCallback(entry)
    }
  }
}

function handleIntersection(
  element: HTMLorSVGElement,
  entry: IntersectionObserverEntry,
) {
  const elIntersectionOwnership = intersectionOwnership.get(element)
  if (elIntersectionOwnership) {
    for (const [_, intersectionCallback] of elIntersectionOwnership) {
      intersectionCallback(entry)
    }
  }
}

function handlePerformance(
  element: HTMLorSVGElement,
  entry: PerformanceObserverEntryList,
) {
  const elPerformanceOwnership = performanceOwnership.get(element)
  if (elPerformanceOwnership) {
    for (const [_, performanceCallback] of elPerformanceOwnership) {
      performanceCallback(element, entry)
    }
  }
}

function applyAttributePlugin(
  el: HTMLorSVGElement,
  camelCasedKey: string,
  hash: number,
) {
  // Extract the raw key from the dataset
  const rawKey = camel(camelCasedKey.slice(alias.length))

  // Find the plugin that matches, since the plugins are sorted by length descending and alphabetically. The first match will be the most specific.
  const plugin = plugins.find((p) => {
    // Ignore keys with the plugin name as a prefix (ignores `classes` but not `classBold`)
    const regex = new RegExp(`^${p.name}([A-Z]|_|$)`)
    return regex.test(rawKey)
  })

  // Skip if no plugin is found
  if (!plugin) return

  // Ensure the element has an id
  if (!el.id.length) el.id = elUniqId(el)

  // Extract the key and modifiers
  let [key, ...rawModifiers] = rawKey.slice(plugin.name.length).split(/\_\_+/)

  const hasKey = key.length > 0
  if (hasKey) {
    key = camel(key)
  }
  const value = el.dataset[camelCasedKey] || ''
  const hasValue = value.length > 0

  // Create the runtime context
  const ctx: RuntimeContext = {
    signals,
    applyToElement,
    effect: (cb: () => void): CleanupUpdateCallback => effect(cb),
    actions,
    removals,
    genRX: () => genRX(ctx, ...(plugin.argNames || [])),
    rx: () => ctx.genRX()(),
    plugin,
    el,
    rawKey,
    key,
    value,
    mods: new Map(),
    runtimeErr: (reason: string, metadata?: object) => runtimeErr(reason, ctx, metadata),
    filtered: (opts?: SignalFilterOptions, obj?: NestedValues) => signals.filtered(opts, obj),
    untracked: <T>(fn: () => T) => untracked(fn),
    fnContent: undefined,
    evt: undefined,
  }

  // Check the requirements
  const keyReq = plugin.keyReq || Requirement.Allowed
  if (hasKey) {
    if (keyReq === Requirement.Denied) {
      throw runtimeErr(`${plugin.name}KeyNotAllowed`, ctx)
    }
  } else if (keyReq === Requirement.Must) {
    throw runtimeErr(`${plugin.name}KeyRequired`, ctx)
  }

  const valReq = plugin.valReq || Requirement.Allowed
  if (hasValue) {
    if (valReq === Requirement.Denied) {
      throw runtimeErr(`${plugin.name}ValueNotAllowed`, ctx)
    }
  } else if (valReq === Requirement.Must) {
    throw runtimeErr(`${plugin.name}ValueRequired`, ctx)
  }

  // Check for exclusive requirements
  if (keyReq === Requirement.Exclusive || valReq === Requirement.Exclusive) {
    if (hasKey && hasValue) {
      throw runtimeErr(`${plugin.name}KeyAndValueProvided`, ctx)
    }
    if (!hasKey && !hasValue) {
      throw runtimeErr(`${plugin.name}KeyOrValueRequired`, ctx)
    }
  }

  for (const rawMod of rawModifiers) {
    const [label, ...mod] = rawMod.split('.')
    ctx.mods.set(camel(label), new Set(mod.map((t) => t.toLowerCase())))
  }

  // Load the plugin
  let cleanupCallback: CleanupUpdateCallback = () => {}
  let mutationCallback: MutationUpdateCallback | undefined
  let resizeCallback: ResizeUpdateCallback | undefined
  let intersectionCallback: IntersectionUpdateCallback | undefined
  let performanceCallback: PerformanceUpdateCallback | undefined

  try {
    const result = plugin.onLoad(ctx)

    if (typeof result === 'function') {
      cleanupCallback = result
    } else if (typeof result === 'object' && result !== null) {
      cleanupCallback = result.cleanupCallback || cleanupCallback
      mutationCallback = result.mutationCallback
      resizeCallback = result.resizeCallback
      intersectionCallback = result.intersectionCallback
      performanceCallback = result.performanceCallback
    }

    // Store the cleanup function
    let elTracking = removals.get(el.id)
    if (!elTracking) {
      elTracking = new Map()
      removals.set(el.id, elTracking)
    }
    elTracking.set(hash, cleanupCallback)

    // Register the attribute with the ownership map
    let elAttributeOwnership = attributeOwnership.get(el)
    if (!elAttributeOwnership) {
      elAttributeOwnership = new Map()
      attributeOwnership.set(el, elAttributeOwnership)
    }
    if (mutationCallback) {
      elAttributeOwnership.set(plugin.name, mutationCallback)
    } else {
      // If no specific mutationCallback is provided, default to re-applying the plugin
      elAttributeOwnership.set(plugin.name, (_newValue: string | null) => {
        // This is the fallback callback for plugins that don't provide their own.
        // It re-applies the plugin to re-synchronize with the signal's value.
        applyAttributePlugin(el, camelCasedKey, hash)
      })
    }

    // Register the resize callback with the ownership map
    if (plugin.observesResize) {
      let elResizeOwnership = resizeOwnership.get(el)
      if (!elResizeOwnership) {
        elResizeOwnership = new Map()
        resizeOwnership.set(el, elResizeOwnership)
      }
      if (resizeCallback) {
        elResizeOwnership.set(plugin.name, resizeCallback)
      } else {
        // If no specific resizeCallback is provided, default to re-applying the plugin
        elResizeOwnership.set(plugin.name, (_entry: ResizeObserverEntry) => {
          applyAttributePlugin(el, camelCasedKey, hash)
        })
      }
    }

    // Register the intersection callback with the ownership map
    if (plugin.observesIntersection) {
      let elIntersectionOwnership = intersectionOwnership.get(el)
      if (!elIntersectionOwnership) {
        elIntersectionOwnership = new Map()
        intersectionOwnership.set(el, elIntersectionOwnership)
      }
      if (intersectionCallback) {
        elIntersectionOwnership.set(plugin.name, intersectionCallback)
      } else {
        // If no specific intersectionCallback is provided, default to re-applying the plugin
        elIntersectionOwnership.set(plugin.name, (_entry: IntersectionObserverEntry) => {
          applyAttributePlugin(el, camelCasedKey, hash)
        })
      }
    }

    // Register the performance callback with the ownership map
    if (plugin.observesPerformance) {
      let elPerformanceOwnership = performanceOwnership.get(el)
      if (!elPerformanceOwnership) {
        elPerformanceOwnership = new Map()
        performanceOwnership.set(el, elPerformanceOwnership)
      }
      if (performanceCallback) {
        elPerformanceOwnership.set(plugin.name, performanceCallback)
      } else {
        // If no specific performanceCallback is provided, default to re-applying the plugin
        elPerformanceOwnership.set(plugin.name, (_element: HTMLorSVGElement, _entry: PerformanceObserverEntryList) => {
          applyAttributePlugin(el, camelCasedKey, hash)
        })
      }
    }

    // If the plugin observes resize events, register the element with the ResizeObserverService
    if (plugin.observesResize) {
      if (!resizeObserverService) {
        resizeObserverService = new ResizeObserverService(handleResize);
      }
      resizeObserverService.observe(el);
    }

    // If the plugin observes intersection events, register the element with the IntersectionObserverService
    if (plugin.observesIntersection) {
      if (!intersectionObserverService) {
        intersectionObserverService = new IntersectionObserverService(handleIntersection);
      }
      intersectionObserverService.observe(el);
    }

    // If the plugin observes performance events, initialize the PerformanceObserverService
    if (plugin.observesPerformance) {
      if (!performanceObserverService) {
        // TODO: Determine appropriate entryTypes based on plugin needs
        performanceObserverService = new PerformanceObserverService(handlePerformance, ['mark', 'measure']);
      }
      // PerformanceObserver does not observe specific elements, so no observe(el) call here
    }
  } catch (error: any) {
    console.error(`[Nexus-UX] Error loading plugin "${plugin.name}" on element`, el, `for attribute "data-${camelCasedKey}":`, error);
    // Clean up any partial state that might have been set before the error
    const elTracking = removals.get(el.id);
    if (elTracking) {
      elTracking.delete(hash);
      if (elTracking.size === 0) {
        removals.delete(el.id);
      }
    }
    // Remove from attribute ownership map if partially added
    const elAttributeOwnership = attributeOwnership.get(el);
    if (elAttributeOwnership) {
      elAttributeOwnership.delete(plugin.name);
      if (elAttributeOwnership.size === 0) {
        attributeOwnership.delete(el);
      }
    }
    // No need to re-throw, allow other plugins and DOM elements to be processed
  }
}

function genRX(
  ctx: RuntimeContext,
  ...argNames: string[]
): RuntimeExpressionFunction {
  let userExpression = ''

  // This regex allows Nexus-UX expressions to support nested
  // regex and strings that contain ; without breaking.
  const statementRe = /(\/(\\\/|[^/])*\/"(\\"|[^"])*"|'(\\'|[^'])*'|`(\\`|[^`])*`|[^;])+/gm
  const statements = ctx.value.trim().match(statementRe)
  if (statements) {
    const lastIdx = statements.length - 1
    const last = statements[lastIdx].trim()
    if (!last.startsWith('return')) {
      statements[lastIdx] = `return (${last});`
    }
    userExpression = statements.join(';\n')
  }

  // Ignore any escaped values
  const escaped = new Map<string, string>()
  const escapeRe = new RegExp(`(?:${DSP})(.*?)(?:${DSS})`, 'gm')
  for (const match of userExpression.matchAll(escapeRe)) {
    const k = match[1]
    const v = new Hash('dsEscaped').with(k).string
    escaped.set(v, k)
    userExpression = userExpression.replace(DSP + k + DSS, v)
  }

  // Replace any action calls
  const actionKeys = Object.keys(actions);
  if (actionKeys.length > 0) {
    const actionsRe = new RegExp(`@(${actionKeys.join('|')})\\(`, 'gm')
    userExpression = userExpression.replaceAll(
      actionsRe,
      'ctx.actions.$1.fn(ctx,',
    )
  }

  // This is the original, stable signal replacement logic.
  // It correctly handles nested signals like $router.layout.
  let signalNames = ctx.signals.paths() || []
  // Also include top-level root keys from the signals values so $root
  // references (e.g. $product) are recognized even when only leaf paths
  // like product.name exist in paths().
  try {
    const roots = Object.keys(ctx.signals.values() || {})
    for (const r of roots) {
      if (!signalNames.includes(r)) signalNames.push(r)
    }
  } catch (e) {
    // ignore
  }

  if (signalNames.length) {
    // Escape any regex-special chars and sort by descending length so
    // longer names (e.g. product.name) are matched before shorter ones.
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    signalNames = Array.from(new Set(signalNames)).map((s) => s).sort((a, b) => b.length - a.length)
    const signalsRe = new RegExp(`\\$(${signalNames.map(esc).join('|')})(\\W|$)`, 'gm')
    userExpression = userExpression.replaceAll(
      signalsRe,
      `ctx.signals.signal('$1').value$2`,
    )
  }

  // Replace any escaped values
  for (const [k, v] of escaped) {
    userExpression = userExpression.replace(k, v)
  }

  const fnContent = `with(scope) { return (() => {\n${userExpression}\n})() }`
  ctx.fnContent = fnContent

  try {
    const fn = new Function('ctx', 'scope', ...argNames, fnContent)
    return (...args: any[]) => {
      try {
        // Re-create proxy on each call to get the latest scope from the stack
        const latestScopeStack = closestDataStack(ctx.el);
        const latestMergedProxy = mergeProxies([...latestScopeStack]);
        return fn(ctx, latestMergedProxy, ...args)
      } catch (error: any) {
        throw runtimeErr('ExecuteExpression', ctx, {
          error: error.message,
        })
      }
    }
  } catch (error: any) {
    throw runtimeErr('GenerateExpression', ctx, {
      error: error.message,
    })
  }
}