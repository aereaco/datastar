// Icon: material-symbols:link
// Slug: Syncs query string params to signal values and vice-versa.
// Description: Syncs query string parameters to signal values on page load, and updates query string parameters when signal values change.

import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
  type SignalFilterOptions,
} from '../../../engine/types'
import { getMatchingSignalPaths } from '../../../utils/paths'
import { jsStrToObject } from '../../../utils/text'

export const QueryString: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'queryString',
  keyReq: Requirement.Denied,
  onLoad: ({ signals, value, effect }) => {
    let filters: SignalFilterOptions = {}
    if (value) {
      filters = jsStrToObject(value)
    }

    const updateSignalsFromQuery = () => {
      const params = new URLSearchParams(window.location.search)
      const newValues: { [key: string]: string } = {}
      for (const [key, val] of params.entries()) {
        newValues[key] = val
      }
      signals.merge(signals.filtered(filters, newValues))
    }

    const updateQueryFromSignals = () => {
      const params = new URLSearchParams(window.location.search)
      const signalPaths = getMatchingSignalPaths(signals, '**')

      for (const path of signalPaths) {
        if (signals.filtered(filters, { [path]: signals.value(path) })[path] !== undefined) {
          params.set(path, String(signals.value(path)))
        }
      }
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
    }

    // Initial sync from query string to signals
    updateSignalsFromQuery()

    // Sync from signals to query string on change
    const cleanupEffect = effect(() => {
      updateQueryFromSignals()
    })

    // Listen for popstate events to update signals when browser history changes
    window.addEventListener('popstate', updateSignalsFromQuery)

    const cleanupCallback: CleanupUpdateCallback = () => {
      cleanupEffect()
      window.removeEventListener('popstate', updateSignalsFromQuery)
    }

    const mutationCallback: MutationUpdateCallback = () => {
      // Re-evaluate filters and re-sync if the attribute value changes
      if (value) {
        filters = jsStrToObject(value)
      }
      updateSignalsFromQuery()
      updateQueryFromSignals()
    }

    return { cleanupCallback, mutationCallback }
  },
}
