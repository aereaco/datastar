import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../engine/types'
import { tagHas, tagToMs } from '../../../utils/tags'
import { modifyViewTransition } from '../../../utils/view-transtions'

export const OnInterval: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'onInterval',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,
  onLoad: ({ mods, genRX }) => {
    let intervalId: number | undefined

    const setupInterval = () => {
      // Clear any existing interval before setting up a new one
      if (intervalId) {
        clearInterval(intervalId)
      }

      const callback = modifyViewTransition(genRX(), mods)

      let duration = 1000
      const durationArgs = mods.get('duration')
      if (durationArgs) {
        duration = tagToMs(durationArgs)
        const leading = tagHas(durationArgs, 'leading', false)
        if (leading) {
          callback()
        }
      }

      intervalId = setInterval(callback, duration)
    }

    // Initial setup
    setupInterval()

    const cleanupCallback: CleanupUpdateCallback = () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }

    const mutationCallback: MutationUpdateCallback = () => {
      setupInterval()
    }

    return { cleanupCallback, mutationCallback }
  },
}