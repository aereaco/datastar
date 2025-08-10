// Icon: material-symbols:visibility-off-outline
// Slug: Ignores an element and its children from Nexus-UX processing during morphing.
// Description: Prevents Nexus-UX from processing an element and its descendants during DOM morphing operations.

import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../../engine/types'

export const IgnoreMorph: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'ignoreMorph',
  keyReq: Requirement.Denied,
  valReq: Requirement.Denied,
  onLoad: ({ el }) => {
    // This plugin primarily acts as a marker for the morphing logic.
    // The actual ignoring logic is handled in the morphing process itself.

    // Add a marker to the element's dataset for morphing logic to recognize
    el.dataset.starIgnoreMorph = 'true'

    const cleanupCallback: CleanupUpdateCallback = () => {
      delete el.dataset.starIgnoreMorph
    }

    const mutationCallback: MutationUpdateCallback = () => {
      // If the attribute is re-added or changed, re-apply the marker
      el.dataset.starIgnoreMorph = 'true'
    }

    return { cleanupCallback, mutationCallback }
  },
}