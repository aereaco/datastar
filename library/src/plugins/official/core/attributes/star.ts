import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type AttributeUpdateCallback,
  type OnRemovalFn,
} from '../../../../engine/types'

export const Star: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'star',
  keyReq: Requirement.Denied,
  valReq: Requirement.Denied,
  onLoad: () => {
    alert('YOU ARE PROBABLY OVERCOMPLICATING IT')

    const cleanup: OnRemovalFn = () => {
      // No cleanup needed as it's a one-time alert
    }

    const updateCallback: AttributeUpdateCallback = () => {
      // Re-trigger the alert if the attribute is changed/re-applied
      alert('YOU ARE PROBABLY OVERCOMPLICATING IT (again!)')
    }

    return [cleanup, updateCallback]
  },
}