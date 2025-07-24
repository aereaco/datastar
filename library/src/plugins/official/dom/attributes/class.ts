import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type AttributeUpdateCallback,
  type OnRemovalFn,
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

    const cleanup: OnRemovalFn = effect(applyClasses)

    const updateCallback: AttributeUpdateCallback = () => {
      // Re-run the effect to apply the latest class values
      applyClasses()
    }

    return [cleanup, updateCallback]
  },
}