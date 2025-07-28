import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../../engine/types'
import { modifyCasing } from '../../../../utils/text'

export const Computed: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'computed',
  keyReq: Requirement.Must,
  valReq: Requirement.Must,
  onLoad: (ctx) => {
    let activeSignalKey: string;
    // This will be the zero-argument function that `signals.setComputed` expects.
    const setupComputedSignal = (signalKey: string, computedFn: () => unknown) => {
      // Ensure any previously set computed signal by this plugin is removed
      // This handles cases where the key itself changes
      if (activeSignalKey && activeSignalKey !== signalKey) {
        ctx.signals.remove(activeSignalKey);
      }

      ctx.signals.setComputed(signalKey, computedFn);
      activeSignalKey = signalKey; // Update the active key
    };

    // Initial setup on load
    const initialRx = ctx.genRX(); // This is the RuntimeExpressionFunction
    // Create a zero-argument wrapper function that calls initialRx with the context
    const initialComputedFn = () => initialRx(ctx); 
    const initialKey = modifyCasing(ctx.key, ctx.mods);
    setupComputedSignal(initialKey, initialComputedFn);

    const cleanupCallback: CleanupUpdateCallback = () => {
      // Remove the computed signal when the plugin is unloaded
      ctx.signals.remove(activeSignalKey); 
    };

    const mutationCallback: MutationUpdateCallback = (newAttributeValue) => {
      const newKey = modifyCasing(ctx.key, ctx.mods); // Re-evaluate key in case mods changed
      const newRx = ctx.genRX(); // Re-generate reactive expression based on new attribute value
      // Create a new zero-argument wrapper function for the updated expression
      const newComputedFn = () => newRx(ctx); 

      // Check if the key or the underlying expression has logically changed
      // (newAttributeValue is the raw string, so we assume if it's different, the expression might be)
      if (newKey !== activeSignalKey || newAttributeValue !== ctx.value) {
        setupComputedSignal(newKey, newComputedFn);
      }
    };

    return { cleanupCallback, mutationCallback };
  },
};
