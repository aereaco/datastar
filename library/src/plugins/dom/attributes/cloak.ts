import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type CleanupUpdateCallback,
  type MutationUpdateCallback,
} from '../../../engine/types'

export const Cloak: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'cloak',
  keyReq: Requirement.Denied,
  valReq: Requirement.Denied,

  onLoad: ({ el }) => {
    const applyCloak = () => {
      // The attribute is removed immediately on load.
      // The delay until this runs is enough to prevent the flicker.
      el.removeAttribute('data-cloak')
    }

    // Initial application
    applyCloak()

    const cleanupCallback: CleanupUpdateCallback = () => {
      // No specific cleanup needed as it only removes an attribute
    }

    const mutationCallback: MutationUpdateCallback = (newValue) => {
      if (newValue !== null) { // Attribute re-added or changed
        applyCloak() // Re-apply cloak behavior
      } else { // Attribute removed
        // No action needed on removal, cleanupCallback is a no-op
      }
    }

    return { cleanupCallback, mutationCallback }
  },
}