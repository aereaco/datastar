import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../../engine/types'
import { kebab, modifyCasing } from '../../../../utils/text'

export const Class: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'class',
  valReq: Requirement.Must,
  onLoad: ({ el, key, mods, effect, genRX }) => {
    const cl = el.classList
    const rx = genRX()

    const applyClasses = () => {
      if (key === '') {
        const classes = rx<Record<string, boolean>>()
        for (const [k, v] of Object.entries(classes)) {
          const classNames = k.split(/\s+/)
          if (v) {
            cl.add(...classNames)
          } else {
            cl.remove(...classNames)
          }
        }
      } else {
        // Default to kebab-case and allow modifying
        let className = kebab(key)
        className = modifyCasing(className, mods)
        
        const shouldInclude = rx<boolean>()
        if (shouldInclude) {
          cl.add(className)
        } else {
          cl.remove(className)
        }
      }
    }

    const cleanupCallback: CleanupUpdateCallback = effect(applyClasses)

    const mutationCallback: MutationUpdateCallback = () => {
      // Re-run the effect to apply the latest class values
      applyClasses()
    }

    return { cleanupCallback, mutationCallback }
  },
}