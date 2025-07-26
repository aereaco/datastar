import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../../engine/types'
import { kebab, modifyCasing } from '../../../../utils/text'
import { modifyTiming } from '../../../../utils/timing'
import { modifyViewTransition } from '../../../../utils/view-transtions'
import { DATASTAR_FETCH_EVENT } from '../../backend/shared'

export const On: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'on',
  keyReq: Requirement.Must,
  valReq: Requirement.Must,
  argNames: ['evt'],
  onLoad: (ctx) => {
    const { el, key, mods, genRX } = ctx

    let currentTarget: Element | Window | Document;
    let currentEventName: string;
    let currentCallback: EventListener;
    let currentEvtListOpts: AddEventListenerOptions;

    const setupEventListener = () => {
      // Remove previous listener if it exists
      if (currentTarget && currentEventName && currentCallback) {
        currentTarget.removeEventListener(currentEventName, currentCallback, currentEvtListOpts);
      }

      const rx = genRX();
      let target: Element | Window | Document = el;
      if (mods.has('window')) target = window;

      let callback = (evt?: Event) => {
        if (evt) {
          // Always prevent default on submit events (because forms)
          if (mods.has('prevent') || key === 'submit') evt.preventDefault();
          if (mods.has('stop')) evt.stopPropagation();
        }
        rx(evt);
      };

      callback = modifyTiming(callback, mods);
      callback = modifyViewTransition(callback, mods);

      const evtListOpts: AddEventListenerOptions = {
        capture: false,
        passive: false,
        once: false,
      };
      if (mods.has('capture')) evtListOpts.capture = true;
      if (mods.has('passive')) evtListOpts.passive = true;
      if (mods.has('once')) evtListOpts.once = true;

      const testOutside = mods.has('outside');
      if (testOutside) {
        target = document;
        const cb = callback;
        const targetOutsideCallback = (e?: Event) => {
          const targetHTML = e?.target as HTMLElement;
          if (!el.contains(targetHTML)) {
            cb(e);
          }
        };
        callback = targetOutsideCallback;
      }

      let eventName = kebab(key);
      eventName = modifyCasing(eventName, mods);

      if (eventName === DATASTAR_FETCH_EVENT) {
        target = document;
      }

      // Store current listener details for cleanup
      currentTarget = target;
      currentEventName = eventName;
      currentCallback = callback;
      currentEvtListOpts = evtListOpts;

      target.addEventListener(eventName, callback, evtListOpts);
    };

    // Initial setup
    setupEventListener();

    const cleanupCallback: CleanupUpdateCallback = () => {
      if (currentTarget && currentEventName && currentCallback) {
        currentTarget.removeEventListener(currentEventName, currentCallback, currentEvtListOpts);
      }
    };

    const mutationCallback: MutationUpdateCallback = () => {
      setupEventListener();
    };

    return { cleanupCallback, mutationCallback };
  },
};