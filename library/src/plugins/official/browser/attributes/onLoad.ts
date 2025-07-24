import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type AttributeUpdateCallback,
  type OnRemovalFn,
} from '../../../../engine/types'
import { tagToMs } from '../../../../utils/tags'
import { modifyViewTransition } from '../../../../utils/view-transtions'

export const OnLoad: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'onLoad',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,
  onLoad: ({ mods, genRX }) => {
    let timeoutId: number | undefined

    const setupOnLoad = () => {
      // Clear any existing timeout before setting up a new one
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      const callback = modifyViewTransition(genRX(), mods)

      let wait = 0
      const delayArgs = mods.get('delay')
      if (delayArgs) {
        wait = tagToMs(delayArgs)
      }

      timeoutId = setTimeout(callback, wait)
    }

    // Initial setup
    setupOnLoad()

    const cleanup: OnRemovalFn = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }

    const updateCallback: AttributeUpdateCallback = () => {
      setupOnLoad()
    }

    return [cleanup, updateCallback]
  },
}