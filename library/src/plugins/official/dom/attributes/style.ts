// Icon: material-symbols:format-paint-outline
// Slug: Sets inline styles on an element based on an expression.
// Description: Sets CSS styles on an element using either key-based or object syntax, and keeps them in sync with reactive signals.

import {
  AttributePlugin,
  PluginType,
  Requirement,
} from '../../../../engine/types'
import { kebab } from '../../../../utils/text'

export const Style: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'style',
  valReq: Requirement.Must,
  onLoad: ({ key, el, effect, rx }) => {
    const { style } = el
    const initialStyles = new Map<string, string>()

    key &&= kebab(key)

    const applyStyle = (prop: string, value: any) => {
      const initial = initialStyles.get(prop)
      if (!value && value !== 0) {
        initial !== undefined &&
          (initial
            ? style.setProperty(prop, initial)
            : style.removeProperty(prop))
      } else {
        initial === undefined &&
          initialStyles.set(prop, style.getPropertyValue(prop))
        style.setProperty(prop, String(value))
      }
    }

    const effectCallback = () => {
      if (key) {
        applyStyle(key, rx())
      } else {
        const styles = rx<Record<string, any>>()

        for (const [prop, initial] of initialStyles) {
          prop in styles ||
            (initial
              ? style.setProperty(prop, initial)
              : style.removeProperty(prop))
        }

        for (const prop in styles) {
          applyStyle(kebab(prop), styles[prop])
        }
      }
    }

    const cleanup = effect(effectCallback)

    const updateCallback = (newValue: string | null) => {
      if (key) {
        applyStyle(key, newValue)
      } else {
        // If key is empty, it means we are binding an object of styles.
        // We need to re-evaluate the expression to get the latest object.
        effectCallback()
      }
    }

    return [cleanup, updateCallback]
  },
}
