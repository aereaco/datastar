// Icon: material-symbols:visibility-off-outline
// Slug: Ignores an element and its children from Nexus-UX processing.
// Description: Prevents Nexus-UX from processing an element and its descendants.

import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../../engine/types'

export const Ignore: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'ignore',
  keyReq: Requirement.Denied,
  valReq: Requirement.Denied,
  onLoad: ({ el, mods }) => {
    // This plugin primarily acts as a marker for the walkDOM function.
    // The actual ignoring logic is handled in walkDOM itself.
    // However, we still need to provide cleanup and mutation callbacks
    // to satisfy the AttributePlugin interface.

    // Add a marker to the element's dataset for walkDOM to recognize
    el.dataset.starIgnore = 'true'

    // If the __self modifier is present, only ignore the element itself
    // and not its descendants. This is handled by a separate marker.
    if (mods.has('self')) {
      el.dataset.starIgnore__self = 'true'
    }

    const cleanupCallback: CleanupUpdateCallback = () => {
      delete el.dataset.starIgnore
      delete el.dataset.starIgnore__self
    }

    const mutationCallback: MutationUpdateCallback = () => {
      // If the attribute is re-added or changed, re-apply the markers
      el.dataset.starIgnore = 'true'
      if (mods.has('self')) {
        el.dataset.starIgnore__self = 'true'
      } else {
        delete el.dataset.starIgnore__self
      }
    }

    return { cleanupCallback, mutationCallback }
  },
}