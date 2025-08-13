import { STATE } from '../../../../engine/consts'
import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type CleanupUpdateCallback,
  type NestedValues,
  STATE_SIGNAL_EVENT,
  type StateSignalEvent,
} from '../../../../engine/types'
import { jsStrToObject } from '../../../../utils/text'

type SignalFilterOptions = {
  include?: RegExp
  exclude?: RegExp
}

export const Persist: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'persist',
  keyReq: Requirement.Allowed,
  valReq: Requirement.Allowed,
  onLoad: ({ el, key, mods, signals, value, effect, runtimeErr }) => {
    // 1. Parse Configuration
    const isAll = mods.has('all')
    const useSessionStorage = mods.has('session')
    const storage = useSessionStorage ? sessionStorage : localStorage
    const storageKey = key || STATE

    let filterOptions: SignalFilterOptions | undefined
    if (value) {
      try {
        const parsed = jsStrToObject(value)
        if (parsed.include || parsed.exclude) {
          filterOptions = {
            include: parsed.include,
            exclude: parsed.exclude,
          }
        }
      } catch (e: any) {
        runtimeErr('PersistFilterParseError', { error: e.message })
      }
    }

    // 2. Initial Load from Storage
    const data = storage.getItem(storageKey)
    if (data) {
      try {
        const parsedData = JSON.parse(data)
        signals.merge(parsedData, false) // onlyIfMissing = false
      } catch (e: any) {
        runtimeErr('PersistParseError', { error: e.message })
        storage.removeItem(storageKey)
      }
    }

    // 3. Reactive Persistence Logic
    const saveState = () => {
      let signalsToPersist: NestedValues

      if (isAll) {
        signalsToPersist = signals.values()
      } else {
        const dataSignalsAttr = el.getAttribute('data-signals')
        if (dataSignalsAttr) {
          try {
            const signalsOnElement = jsStrToObject(dataSignalsAttr)
            const signalPathsToWatch = Object.keys(signalsOnElement)
            signalsToPersist = signals.subset(...signalPathsToWatch)
          } catch (e: any) {
            runtimeErr('PersistSignalParseError', { error: e.message })
            signalsToPersist = {}
          }
        } else {
          signalsToPersist = {}
        }
      }

      const filteredSignals = signals.filtered(filterOptions, signalsToPersist)
      storage.setItem(storageKey, JSON.stringify(filteredSignals))
    }

    // 4. Setup reactive listener
    let cleanup: CleanupUpdateCallback
    if (isAll) {
      const signalListener = (event: CustomEvent<StateSignalEvent>) => {
        if (event.detail.added.length > 0 || event.detail.updated.length > 0 || event.detail.removed.length > 0) {
          saveState()
        }
      }
      document.addEventListener(STATE_SIGNAL_EVENT, signalListener as EventListener)
      cleanup = () => document.removeEventListener(STATE_SIGNAL_EVENT, signalListener as EventListener)
      saveState() // Initial save
    } else {
      cleanup = effect(() => {
        // Establish dependencies on the signals for the effect to re-run
        const dataSignalsAttr = el.getAttribute('data-signals')
        if (dataSignalsAttr) {
          try {
            const signalsOnElement = jsStrToObject(dataSignalsAttr)
            const signalPathsToWatch = Object.keys(signalsOnElement)
            for (const path of signalPathsToWatch) {
              signals.value(path) // access each signal
            }
          } catch (e: any) {
            // This error is already caught in saveState, but we need to avoid crashing the effect
          }
        }
        saveState()
      })
    }

    return cleanup
  },
}
