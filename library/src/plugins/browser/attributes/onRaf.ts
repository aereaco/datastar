import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../engine/types'
import { modifyTiming } from '../../../utils/timing'
import { modifyViewTransition } from '../../../utils/view-transtions'

export const OnRaf: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'onRaf',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,
  onLoad: ({ mods, genRX }) => {
    let rafId: number | undefined

    const setupRaf = () => {
      // Cancel any existing RAF before setting up a new one
      if (rafId) {
        cancelAnimationFrame(rafId)
      }

      let callback = modifyTiming(genRX(), mods)
      callback = modifyViewTransition(callback, mods)

      const raf = () => {
        callback()
        rafId = requestAnimationFrame(raf)
      }
      rafId = requestAnimationFrame(raf)
    }

    // Initial setup
    setupRaf()

    const cleanupCallback: CleanupUpdateCallback = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }

    const mutationCallback: MutationUpdateCallback = () => {
      setupRaf()
    }

    return { cleanupCallback, mutationCallback }
  },
}