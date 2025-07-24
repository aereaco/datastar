import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type AttributeUpdateCallback,
  type OnRemovalFn,
} from '../../../../engine/types'
import { supportsViewTransitions } from '../../../../utils/view-transtions'

export const ViewTransition: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'viewTransition',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,
  onLoad: ({ effect, el, genRX }) => {
    if (!supportsViewTransitions) {
      console.error('Browser does not support view transitions')
      return // No cleanup or updateCallback needed if not supported
    }
    const rx = genRX()

    const applyViewTransitionName = () => {
      const name = rx<string>()
      const elVTASTyle = el.style as unknown as CSSStyleDeclaration
      if (name?.length) {
        elVTASTyle.viewTransitionName = name
      } else {
        elVTASTyle.viewTransitionName = '' // Clear the name if expression is empty
      }
    }

    const cleanup: OnRemovalFn = effect(applyViewTransitionName)

    const updateCallback: AttributeUpdateCallback = () => {
      applyViewTransitionName()
    }

    return [cleanup, updateCallback]
  },
}