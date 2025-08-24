// Icon: si:json-fill
// Slug: Outputs a JSON stringified version of signals.
// Description: Sets the text content of an element to a reactive JSON stringified version of signals.

import {
  type AttributePlugin,
  type SignalFilterOptions,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../engine/types'
import { jsStrToObject } from '../../../utils/text'

export const JsonSignals: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'jsonSignals',
  keyReq: Requirement.Denied,
  onLoad: ({ el, effect, value, filtered, mods }) => {
    const spaces = mods.has('terse') ? 0 : 2
    let filters: SignalFilterOptions = {}
    if (value) {
      filters = jsStrToObject(value)
    }

    const callback = () => {
      observer.disconnect()
      el.textContent = JSON.stringify(filtered(filters), null, spaces)
      observer.observe(el, {
        childList: true,
        characterData: true,
        subtree: true,
      })
    }
    const observer = new MutationObserver(callback)
    const cleanup = effect(callback)

    const cleanupCallback: CleanupUpdateCallback = () => {
      observer.disconnect()
      cleanup()
    }

    const mutationCallback: MutationUpdateCallback = () => {
      // Re-evaluate filters and re-run callback if the attribute value changes
      if (value) {
        filters = jsStrToObject(value)
      }
      callback()
    }

    return { cleanupCallback, mutationCallback }
  },
}
