import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type AttributeUpdateCallback,
  type OnRemovalFn,
} from '../../../../engine/types'
import { kebab } from '../../../../utils/text'

export const Style: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'style',
  valReq: Requirement.Must,
  onLoad: ({ key, el, effect, genRX }) => {
    const { style } = el
    const initialStyles = new Map<string, string>()

    key &&= kebab(key)

    const applyStyles = () => {
      if (key) {
        const value = genRX()()
        const initial = initialStyles.get(key)
        if (!value && value !== 0) {
          initial !== undefined &&
            (initial
              ? style.setProperty(key, initial)
              : style.removeProperty(key))
        } else {
          initial === undefined &&
            initialStyles.set(key, style.getPropertyValue(key))
          style.setProperty(key, String(value))
        }
      } else {
        const styles = genRX()<Record<string, any>>()

        for (const [prop, initial] of initialStyles) {
          prop in styles ||
            (initial
              ? style.setProperty(prop, initial)
              : style.removeProperty(prop))
        }

        for (const prop in styles) {
          const kebabProp = kebab(prop)
          const value = styles[prop]
          const initial = initialStyles.get(kebabProp)
          if (!value && value !== 0) {
            initial !== undefined &&
              (initial
                ? style.setProperty(kebabProp, initial)
                : style.removeProperty(kebabProp))
          } else {
            initial === undefined &&
              initialStyles.set(kebabProp, style.getPropertyValue(kebabProp))
            style.setProperty(kebabProp, String(value))
          }
        }
      }
    }

    const cleanup: OnRemovalFn = effect(applyStyles)

    const updateCallback: AttributeUpdateCallback = () => {
      applyStyles()
    }

    return [cleanup, updateCallback]
  },
}