// Icon: material-symbols:save-outline
// Slug: Preserves the value of an attribute when morphing DOM elements.
// Description: Ensures that the specified attribute's value is retained during DOM morphing operations.

import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../engine/types'

export const PreserveAttr: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'preserveAttr',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,
  onLoad: ({ el, value }) => {
    // This plugin primarily acts as a marker for the morphing logic.
    // The actual preserving logic is handled in the morphing process itself.

    // Add the attribute names to a dataset for the morphing logic to recognize
    el.dataset.starPreserveAttr = value

    const cleanupCallback: CleanupUpdateCallback = () => {
      delete el.dataset.starPreserveAttr
    }

    const mutationCallback: MutationUpdateCallback = (newValue) => {
      // If the attribute is re-added or changed, re-apply the marker
      el.dataset.starPreserveAttr = newValue || ''
    }

    return { cleanupCallback, mutationCallback }
  },
}
