// Icon: material-symbols:change-circle-outline
// Slug: Runs an expression when signals are patched.
// Description: Runs an expression whenever one or more signals are patched.

import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type SignalFilterOptions,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../engine/types'
import { isEmpty } from '../../../utils/paths'
import { jsStrToObject } from '../../../utils/text'
import { modifyTiming } from '../../../utils/timing'
import { STATE } from '../../../engine/consts'

export const STATE_SIGNAL_PATCH_EVENT = `${STATE}-signals-patch`

export interface JSONPatch {
  op: 'add' | 'remove' | 'replace'
  path: string
  value?: any
}

export const OnSignalPatch: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'onSignalPatch',
  valReq: Requirement.Must,
  argNames: ['patch'],
  onLoad: (ctx) => {
    const { el, key, mods, plugin, rx, runtimeErr, filtered } = ctx

    // Throw an error if the key exists and is not `filter`
    if (!!key && key !== 'filter') {
      throw runtimeErr(`${plugin.name}KeyNotAllowed`, ctx)
    }

    // Look for data-on-signal-patch-filter data attribute
    const filtersRaw = el.getAttribute('data-on-signal-patch-filter')
    let filters: SignalFilterOptions = {}
    if (filtersRaw) {
      filters = jsStrToObject(filtersRaw)
    }

    const callback: EventListener = modifyTiming(
      (evt: CustomEvent<JSONPatch>) => {
        const watched = filtered(filters, evt.detail)
        if (!isEmpty(watched)) {
          rx(watched)
        }
      },
      mods,
    )

    document.addEventListener(STATE_SIGNAL_PATCH_EVENT, callback)

    const cleanupCallback: CleanupUpdateCallback = () => {
      document.removeEventListener(STATE_SIGNAL_PATCH_EVENT, callback)
    }

    const mutationCallback: MutationUpdateCallback = () => {
      // Re-setup the event listener if the attribute changes
      cleanupCallback() // Remove old listener
      // Re-add listener with potentially updated mods or filters
      const newFiltersRaw = el.getAttribute('data-on-signal-patch-filter')
      if (newFiltersRaw) {
        filters = jsStrToObject(newFiltersRaw)
      }
      document.addEventListener(STATE_SIGNAL_PATCH_EVENT, callback)
    }

    return { cleanupCallback, mutationCallback }
  },
}