import { runtimeErr } from '../../../engine/errors'
import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../engine/types'

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

    const cleanupCallback: CleanupUpdateCallback = effect(applyCustomValidity)

    const mutationCallback: MutationUpdateCallback = () => {
      applyCustomValidity()
    }

    return { cleanupCallback, mutationCallback }
  },
}