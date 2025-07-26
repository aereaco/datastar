import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../../engine/types'

export const Star: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'star',
  keyReq: Requirement.Denied,
  valReq: Requirement.Denied,
  onLoad: () => {
    alert('YOU ARE PROBABLY OVERCOMPLICATING IT')

    const cleanupCallback: CleanupUpdateCallback = () => {
      // No cleanup needed as it's a one-time alert
    }

    const mutationCallback: MutationUpdateCallback = () => {
      // Re-trigger the alert if the attribute is changed/re-applied
      alert('YOU ARE PROBABLY OVERCOMPLICATING IT (again!)')
    }

    return { cleanupCallback, mutationCallback }
  },
}