import {
  DATASTAR_FETCH_EVENT,
  type DatastarFetchEvent,
  FINISHED,
  STARTED,
} from '../shared'

import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type AttributeUpdateCallback,
  type OnRemovalFn,
} from '../../../../engine/types'

import { modifyCasing, trimDollarSignPrefix } from '../../../../utils/text'

export const Indicator: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'indicator',
  keyReq: Requirement.Exclusive,
  valReq: Requirement.Exclusive,
  onLoad: ({ key, mods, signals, value }) => {
    let currentSignalName: string;
    let currentWatcher: EventListener;

    const setupIndicator = (signalName: string) => {
      // Clean up previous watcher if it exists
      if (currentWatcher) {
        document.removeEventListener(DATASTAR_FETCH_EVENT, currentWatcher);
      }

      currentSignalName = signalName;
      const { signal } = signals.upsertIfMissing(currentSignalName, false);

      currentWatcher = ((event: CustomEvent<DatastarFetchEvent>) => {
        const { type } = event.detail;
        // Ensure we only react to events for the currently managed signal name
        // This is a safeguard, as the watcher should be removed/re-added correctly
        // if the signalName changes.
        if (signal.value === undefined) { // Check if signal was removed externally
          document.removeEventListener(DATASTAR_FETCH_EVENT, currentWatcher);
          return;
        }

        switch (type) {
          case STARTED:
            signal.value = true;
            break;
          case FINISHED:
            signal.value = false;
            // The watcher is removed when the plugin is cleaned up or updated,
            // not necessarily when a single request finishes.
            break;
        }
      }) as EventListener;

      document.addEventListener(DATASTAR_FETCH_EVENT, currentWatcher);
    };

    // Initial setup
    const initialSignalName = key
      ? modifyCasing(key, mods)
      : trimDollarSignPrefix(value);
    setupIndicator(initialSignalName);

    const cleanup: OnRemovalFn = () => {
      if (currentWatcher) {
        document.removeEventListener(DATASTAR_FETCH_EVENT, currentWatcher);
      }
      // Optionally, set the signal back to false when the indicator is removed
      signals.setValue(currentSignalName, false);
    };

    const updateCallback: AttributeUpdateCallback = (newAttributeValue) => {
      const newSignalName = key
        ? modifyCasing(key, mods)
        : trimDollarSignPrefix(newAttributeValue || '');

      if (newSignalName !== currentSignalName) {
        setupIndicator(newSignalName);
      }
    };

    return [cleanup, updateCallback];
  },
};