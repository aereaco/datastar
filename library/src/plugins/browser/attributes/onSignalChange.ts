
import {
  type AttributePlugin,
  STATE_SIGNAL_EVENT,
  type StateSignalEvent,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../engine/types'
import { pathMatchesPattern } from '../../../utils/paths'
import { modifyCasing } from '../../../utils/text'
import { modifyTiming } from '../../../utils/timing'
import { modifyViewTransition } from '../../../utils/view-transtions'
import { effect, type Signal } from '../../../vendored/preact-core'

export const OnSignalChange: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'onSignalChange',
  valReq: Requirement.Must,
  onLoad: ({ key, mods, signals, genRX }) => {
    let currentCleanup: CleanupUpdateCallback = () => {}

    const setupSignalChangeWatcher = () => {
      currentCleanup() // Clean up any previous watcher

      let callback = modifyTiming(genRX(), mods)
      callback = modifyViewTransition(callback, mods)

      if (key === '') {
        const signalFn = (event: CustomEvent<StateSignalEvent>) =>
          callback(event)
        document.addEventListener(STATE_SIGNAL_EVENT, signalFn)

        currentCleanup = () => {
          document.removeEventListener(STATE_SIGNAL_EVENT, signalFn)
        }
      } else {
        const pattern = modifyCasing(key, mods)
        const signalValues = new Map<Signal, any>()
        signals.walk((path, signal) => {
          if (pathMatchesPattern(path, pattern)) {
            signalValues.set(signal, signal.value)
          }
        })

        currentCleanup = effect(() => {
          for (const [signal, prev] of signalValues) {
            if (prev !== signal.value) {
              callback()
              signalValues.set(signal, signal.value)
            }
          }
        })
      }
    }

    // Initial setup
    setupSignalChangeWatcher()

    const cleanupCallback: CleanupUpdateCallback = () => {
      currentCleanup()
    }

    const mutationCallback: MutationUpdateCallback = () => {
      setupSignalChangeWatcher()
    }

    return { cleanupCallback, mutationCallback }
  },
}
