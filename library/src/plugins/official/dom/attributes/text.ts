// Authors: Delaney Gillilan
// Icon: tabler:typography
// Slug: Set the text content of an element
// Description: This attribute sets the text content of an element to the result of the expression.

import { runtimeErr } from '../../../../engine/errors'
import {
  type AttributePlugin,
  PluginType,
  Requirement,
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

    const effectCallback = () => {
      const res = rx(ctx)
      el.textContent = `${res}`
    }

    const cleanup = effect(effectCallback)

    const updateCallback = (newValue: string | null) => {
      el.textContent = newValue ?? ''
    }

    return [cleanup, updateCallback]
  },
}
