import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type AttributeUpdateCallback,
  type OnRemovalFn,
} from '../../../../engine/types'
import { modifyCasing, trimDollarSignPrefix } from '../../../../utils/text'

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

    const cleanup: OnRemovalFn = () => {
      // When the plugin is removed, clear the signal's value
      signals.setValue(currentSignalName, null);
    };

    const updateCallback: AttributeUpdateCallback = (newAttributeValue) => {
      const newSignalName = key
        ? modifyCasing(key, mods)
        : trimDollarSignPrefix(newAttributeValue || '');

      if (newSignalName !== currentSignalName) {
        setupRef(newSignalName);
      }
    };

    return [cleanup, updateCallback];
  },
};