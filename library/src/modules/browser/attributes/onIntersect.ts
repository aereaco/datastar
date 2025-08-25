import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
  type IntersectionUpdateCallback,
} from '../../../engine/types'
import { modifyTiming } from '../../../utils/timing'
import { modifyViewTransition } from '../../../utils/view-transtions'

export const OnIntersect: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'onIntersect',
  keyReq: Requirement.Denied,
  observesIntersection: true,
  onLoad: ({ el, rawKey, mods, genRX }) => {
    let callback = modifyTiming(genRX(), mods)
    callback = modifyViewTransition(callback, mods)

    const intersectionCallback: IntersectionUpdateCallback = (entry) => {
      if (entry.isIntersecting) {
        callback()

        if (mods.has('once')) {
          // The engine will unobserve this element when the plugin is removed
          // We just need to remove the attribute to prevent re-application
          delete el.dataset[rawKey]
        }
      }
    }

    const cleanupCallback: CleanupUpdateCallback = () => {
      // Cleanup is handled by the engine's handleMutation when the element is removed
      // No specific unobserve call needed here as it's managed by the engine
    }

    const mutationCallback: MutationUpdateCallback = () => {
      // Re-evaluate the callback if the attribute changes
      callback = modifyTiming(genRX(), mods)
      callback = modifyViewTransition(callback, mods)
    }

    return { cleanupCallback, mutationCallback, intersectionCallback }
  },
}