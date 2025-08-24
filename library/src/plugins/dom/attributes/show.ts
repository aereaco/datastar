import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../engine/types'

const NONE = 'none'
const DISPLAY = 'display'

export const Show: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'show',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,
  onLoad: ({ el, genRX, effect }) => {
    const { style: s } = el
    const rx = genRX()

    const applyShow = () => {
      const shouldShow = rx<boolean>()
      if (shouldShow) {
        if (s.display === NONE) {
          s.removeProperty(DISPLAY)
        }
      } else {
        s.setProperty(DISPLAY, NONE)
      }
    }

    const cleanupCallback: CleanupUpdateCallback = effect(applyShow)

    const mutationCallback: MutationUpdateCallback = () => {
      applyShow()
    }

    return { cleanupCallback, mutationCallback }
  },
}