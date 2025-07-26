import {
  type AttributePlugin,
  type NestedValues,
  PluginType,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../../engine/types'
import { modifyCasing } from '../../../../utils/text'

export const Signals: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'signals',
  onLoad: (ctx) => {
    const { key, mods, signals, value, genRX } = ctx
    const ifMissing = mods.has('ifmissing')

    let managedSignalPaths: string[] = []; // Tracks signals explicitly set/managed by this plugin instance

    const setupSignals = (currentAttributeValue: string) => {
      // Clean up any previously set signals
      if (managedSignalPaths.length > 0) {
        signals.remove(...managedSignalPaths);
        managedSignalPaths = []; // Reset for the new setup
      }

      if (key !== '') {
        const k = modifyCasing(key, mods);
        // Execute genRX() with ctx to get the actual value from the expression
        const v = currentAttributeValue === '' ? currentAttributeValue : genRX()(ctx); 
        
        if (ifMissing) {
          signals.upsertIfMissing(k, v);
        } else {
          signals.setValue(k, v);
        }
        managedSignalPaths.push(k);
      } else {
        // Execute genRX() with ctx to get the actual nested values object from the expression
        const rx = genRX();
        const newValues = rx(ctx) as NestedValues; 

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
