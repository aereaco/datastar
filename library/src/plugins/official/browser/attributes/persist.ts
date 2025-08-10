import { STATE } from '../../../../engine/consts'
import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../../engine/types'
import { getMatchingSignalPaths } from '../../../../utils/paths'

export const Persist: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'persist',
  keyReq: Requirement.Denied,
  onLoad: ({ effect, mods, signals, value }) => {
    const storageKey = STATE
    let currentStorage = mods.has('session') ? sessionStorage : localStorage
    let currentPaths = value !== '' ? value : '**'

    const setupPersist = (storage: Storage, paths: string) => {
      const storageToSignals = () => {
        const data = storage.getItem(storageKey) || '{}'
        const nestedValues = JSON.parse(data)
        signals.merge(nestedValues)
      }

      const signalsToStorage = () => {
        const signalPaths = getMatchingSignalPaths(signals, paths)
        const nv = signals.subset(...signalPaths)
        storage.setItem(storageKey, JSON.stringify(nv))
      }

      storageToSignals()
      return effect(() => {
        signalsToStorage()
      })
    }

    let currentCleanup: CleanupUpdateCallback = setupPersist(currentStorage, currentPaths)

    const cleanupCallback: CleanupUpdateCallback = () => {
      currentCleanup()
    }

    const mutationCallback: MutationUpdateCallback = (newValue) => {
      const newPaths = newValue !== '' ? newValue || '**' : '**'
      const newStorage = mods.has('session') ? sessionStorage : localStorage

      if (newPaths !== currentPaths || newStorage !== currentStorage) {
        currentCleanup() // Clean up old effect
        currentPaths = newPaths
        currentStorage = newStorage
        currentCleanup = setupPersist(currentStorage, currentPaths) // Set up new effect
      }
    }

    return { cleanupCallback, mutationCallback }
  },
}