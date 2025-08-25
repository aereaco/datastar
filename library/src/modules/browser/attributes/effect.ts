// Icon: oui:security-signal
// Slug: Executes an expression when signals change.
// Description: Executes an expression on page load and whenever any signals in the expression change.

import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../engine/types'

export const Effect: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'effect',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,
  onLoad: ({ effect, rx }) => {
    const cleanupCallback: CleanupUpdateCallback = effect(rx)

    const mutationCallback: MutationUpdateCallback = () => {
      // Re-run the effect if the attribute value changes
      cleanupCallback() // Clean up the old effect
      effect(rx) // Create a new effect with the updated expression
    }

    return { cleanupCallback, mutationCallback }
  },
}
