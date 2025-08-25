import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../engine/types'
import { modifyCasing, trimDollarSignPrefix } from '../../../utils/text'

export const Ref: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'ref',
  keyReq: Requirement.Exclusive,
  valReq: Requirement.Exclusive,
  onLoad: ({ el, key, mods, signals, value }) => {
    let currentSignalName: string;

    const setupRef = (signalName: string) => {
      // If there was a previous signal name, clear its value
      if (currentSignalName && currentSignalName !== signalName) {
        signals.setValue(currentSignalName, null);
      }
      signals.setValue(signalName, el);
      currentSignalName = signalName;
    };

    // Initial setup
    const initialSignalName = key
      ? modifyCasing(key, mods)
      : trimDollarSignPrefix(value);
    setupRef(initialSignalName);

    const cleanupCallback: CleanupUpdateCallback = () => {
      // When the plugin is removed, clear the signal's value
      signals.setValue(currentSignalName, null);
    };

    const mutationCallback: MutationUpdateCallback = (newAttributeValue) => {
      const newSignalName = key
        ? modifyCasing(key, mods)
        : trimDollarSignPrefix(newAttributeValue || '');

      if (newSignalName !== currentSignalName) {
        setupRef(newSignalName);
      }
    };

    return { cleanupCallback, mutationCallback };
  },
};