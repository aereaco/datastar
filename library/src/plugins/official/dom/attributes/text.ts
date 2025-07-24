import { runtimeErr } from '../../../../engine/errors'
import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type AttributeUpdateCallback,
  type OnRemovalFn,
} from '../../../../engine/types'

export const Text: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'text',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,
  onLoad: (ctx) => {
    const { el, effect, genRX } = ctx
    if (!(el instanceof HTMLElement)) {
      runtimeErr('TextInvalidElement', ctx)
    }
    const rx = genRX()

    const applyText = () => {
      const res = rx(ctx)
      el.textContent = `${res}`
    }

    const cleanup: OnRemovalFn = effect(applyText)

    const updateCallback: AttributeUpdateCallback = () => {
      applyText()
    }

    return [cleanup, updateCallback]
  },
}