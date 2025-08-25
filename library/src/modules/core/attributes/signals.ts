import {
  type AttributePlugin,
  type NestedValues,
  PluginType,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../engine/types'
import { attrHash } from '../../../utils/dom'
import { modifyCasing } from '../../../utils/text'

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

    const setupSignals = (currentAttributeValue: string) => {
      // Clean up any previously set signals
      if (managedSignalPaths.length > 0) {
        signals.remove(...managedSignalPaths);
        managedSignalPaths = []; // Reset for the new setup
      }

      const rx = genRX()

      if (key !== '') {
        const k = modifyCasing(key, mods);
        // Execute genRX() to get the actual value from the expression
        const v = currentAttributeValue === '' ? currentAttributeValue : rx(); 
        
        if (ifMissing) {
          signals.upsertIfMissing(k, v);
        } else {
          signals.setValue(k, v);
        }
        managedSignalPaths.push(k);
      } else {
        // Execute genRX() to get the actual nested values object from the expression
        const newValues = rx() as NestedValues; 

        // Recursively collect all paths that are being set by this operation
        // This is crucial for accurate cleanup later.
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
    };

    // Initial setup on plugin load
    setupSignals(value);

    // Cleanup function for when the plugin is removed from the DOM or its attribute changes
    const cleanupCallback: CleanupUpdateCallback = () => {
      signals.remove(...managedSignalPaths);
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