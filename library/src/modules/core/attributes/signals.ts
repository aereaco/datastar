import {
  type AttributePlugin,
  type NestedValues,
  PluginType,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../engine/types'
import { attrHash } from '../../../utils/dom'
import { modifyCasing } from '../../../utils/text'
import { addScopeToNode } from '../../../engine/scope' // Import addScopeToNode

const FETCHING_ATTR_CAMEL = 'nexusSignalsFetching'

export const Signals: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'signals',
  onLoad: (ctx) => {
    const { el, key, mods, signals, value, genRX, applyToElement, runtimeErr } = ctx
    const ifMissing = mods.has('ifmissing')
    const isFetch = mods.has('fetch')

    if (el.dataset[FETCHING_ATTR_CAMEL]) {
      return
    }

    if (isFetch) {
      let url: string;
      try {
        // First, try to evaluate as a JS expression. This supports dynamic URLs from signals.
        const rx = genRX();
        url = rx();
      } catch (e) {
        // If it fails, assume it's a literal string URL.
        // This allows for unquoted URLs in the attribute.
        url = value;
      }

      if (typeof url !== 'string' || !url) {
        runtimeErr('SignalsFetchError', { error: 'Invalid URL provided to fetch signals.' })
        return
      }

      (async () => {
        el.dataset[FETCHING_ATTR_CAMEL] = 'true'
        try {
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`Failed to fetch signals from ${url}: ${response.statusText}`)
          }
          const data = await response.json()
          signals.merge(data, ifMissing)

          if (!el.hasAttribute('data-signals')) {
            const signalNames = Object.keys(data)
            const dataSignalsValue = `{${signalNames.map(key => `'${key}': {}`).join(',')}}`
            el.setAttribute('data-signals', dataSignalsValue)

            // Force re-application of persist plugin
            const persistAttrHash = attrHash('persist', el.dataset.persist || '')
            const elCleanups = ctx.removals.get(el.id)
            if (elCleanups && elCleanups.has(persistAttrHash)) {
              const cleanup = elCleanups.get(persistAttrHash)
              if (cleanup) cleanup()
              elCleanups.delete(persistAttrHash)
            }
          }
        } catch (error) {
          runtimeErr('SignalsFetchError', { error })
        } finally {
          delete el.dataset[FETCHING_ATTR_CAMEL]
          // Re-walk the DOM to apply any new attributes that might have been added
          // by the fetched signals.
          applyToElement(el)
        }
      })()
      return
    }

  let managedSignalPaths: string[] = []; // Tracks signals explicitly set/managed by this plugin instance
  let currentRemoveScope: (() => void) | undefined; // Tracks the cleanup function for the local scope

    const setupSignals = (currentAttributeValue: string) => {
      // Clean up any previously set signals
      if (managedSignalPaths.length > 0) {
        signals.remove(...managedSignalPaths);
        managedSignalPaths = []; // Reset for the new setup
      }

      const rx = genRX()

      let topLevelSignals: string[] = []; // To store top-level signal names for local scope

      if (key !== '') {
        const k = modifyCasing(key, mods);
        const v = currentAttributeValue === '' ? currentAttributeValue : rx();

        if (ifMissing) {
          signals.upsertIfMissing(k, v);
        } else {
          signals.setValue(k, v);
        }
        managedSignalPaths.push(k);
        topLevelSignals.push(k.split('.')[0]); // Capture top-level name
      } else {
        const newValues = rx() as NestedValues;

        // Capture top-level keys immediately so nested objects like `product`
        // are exposed as top-level names in the local scope (they may be
        // backed by leaf signals after merge). We'll still merge the nested
        // values into the signals registry so leaf paths are available.
        topLevelSignals = Object.keys(newValues);

        // Collect all leaf paths for cleanup/management after merge
        const collectPaths = (obj: NestedValues, prefix: string = '') => {
          for (const prop in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
              const currentPath = prefix ? `${prefix}.${prop}` : prop;
              if (typeof obj[prop] === 'object' && obj[prop] !== null && !Array.isArray(obj[prop])) {
                collectPaths(obj[prop] as NestedValues, currentPath);
              } else {
                managedSignalPaths.push(currentPath);
              }
            }
          }
        };
        collectPaths(newValues);

        signals.merge(newValues, ifMissing);
      }

      // Clean up previous local scope if it exists
      if (currentRemoveScope) {
        currentRemoveScope();
      }

      // Create a proxy for local scope exposure (reverting Experiment 1)
      const localScopeProxy = {};
      for (const signalName of new Set(topLevelSignals)) { // Use Set to avoid duplicates
        Object.defineProperty(localScopeProxy, signalName, {
          get: () => {
            // Prefer an explicit top-level signal when present, otherwise
            // reconstruct the object from leaf signals via subset().
            try {
              if (signals.exists(signalName)) {
                return signals.value(signalName)
              }
            } catch {
              // ignore - we'll fall back to subset below
            }
            return signals.subset(signalName)
          },
          enumerable: true, // Make it enumerable so it appears in `with(scope)`
        });
      }

      // Add this proxy to the element's local scope
      currentRemoveScope = addScopeToNode(el, localScopeProxy);
    };

    // Initial setup on plugin load
    setupSignals(value);

    // Cleanup function for when the plugin is removed from the DOM or its attribute changes
    const cleanupCallback: CleanupUpdateCallback = () => {
      if (currentRemoveScope) {
        currentRemoveScope(); // Clean up local scope
      }
      signals.remove(...managedSignalPaths); // Existing cleanup for global signals
    };

    // Update callback for when the data-signals attribute value changes
    const mutationCallback: MutationUpdateCallback = (newAttributeValue) => {
      // Only re-setup if the attribute value (expression) has changed
      // We compare against the original 'value' from the onLoad context to detect changes
      // If the attribute is removed (newValue is null), we treat it as an empty string for re-setup
      if (newAttributeValue !== value) {
        setupSignals(newAttributeValue || '');
      }
    };

    return { cleanupCallback, mutationCallback };
  },
};