import { runtimeErr } from '../../../../engine/errors'
import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type AttributeUpdateCallback,
  type OnRemovalFn,
} from '../../../../engine/types'

export const CustomValidity: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'customValidity',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,
  onLoad: (ctx) => {
    const { el, genRX, effect } = ctx
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) {
      throw runtimeErr('CustomValidityInvalidElement', ctx)
    }
    const rx = genRX()

    const applyCustomValidity = () => {
      const result = rx<string>()
      if (typeof result !== 'string') {
        throw runtimeErr('CustomValidityInvalidExpression', ctx, { result })
      }
      el.setCustomValidity(result)
    }

    const cleanup: OnRemovalFn = effect(applyCustomValidity)

    const updateCallback: AttributeUpdateCallback = () => {
      applyCustomValidity()
    }

    return [cleanup, updateCallback]
  },
}