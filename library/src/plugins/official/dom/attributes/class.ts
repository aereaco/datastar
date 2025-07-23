// Authors: Delaney Gillilan
// Icon: ic:baseline-format-paint
// Slug: Add or remove classes from an element reactively
// Description: This action adds or removes classes from an element reactively based on the expression provided. The expression should be an object where the keys are the class names and the values are booleans. If the value is true, the class is added. If the value is false, the class is removed.

import {
  type AttributePlugin,
  PluginType,
  Requirement,
} from '../../../../engine/types'
import { kebab, modifyCasing } from '../../../../utils/text'

export const Class: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'class',
  valReq: Requirement.Must,
  onLoad: ({ el, key, mods, effect, genRX }) => {
    const cl = el.classList
    const rx = genRX()

    const effectCallback = () => {
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

    const cleanup = effect(effectCallback)

    const updateCallback = (newValue: string | null) => {
      if (key === '') {
        // If key is empty, it means we are binding an object of classes.
        // We need to re-evaluate the expression to get the latest object.
        effectCallback()
      } else {
        // For single class binding, directly use newValue
        let className = kebab(key)
        className = modifyCasing(className, mods)
        if (newValue === null || newValue === 'false') {
          cl.remove(className)
        } else {
          cl.add(className)
        }
      }
    }

    return [cleanup, updateCallback]
  },
}
