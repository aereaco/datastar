import {
  type AttributePlugin,
  type NestedValues,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../../engine/types'
import { kebab } from '../../../../utils/text'

export const Attr: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'attr',
  valReq: Requirement.Must,
  onLoad: ({ el, key, effect, genRX }) => {
    const rx = genRX()

    const applyAttributes = () => {
      if (key === '') {
        const binds = rx<NestedValues>()
        for (const [k, val] of Object.entries(binds)) {
          if (val === false || val === null || val === undefined) {
            el.removeAttribute(k)
          } else {
            el.setAttribute(k, String(val))
          }
        }
      } else {
        const attributeName = kebab(key)
        const value = rx()
        if (value === false || value === null || value === undefined) {
          el.removeAttribute(attributeName)
        } else {
          el.setAttribute(attributeName, String(value))
        }
      }
    }

    const cleanupCallback: CleanupUpdateCallback = effect(applyAttributes)

    const mutationCallback: MutationUpdateCallback = () => {
      // Re-run the effect to apply the latest attribute values
      applyAttributes()
    }

    return { cleanupCallback, mutationCallback }
  },
}