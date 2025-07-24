import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type AttributeUpdateCallback,
  type OnRemovalFn,
} from '../../../../engine/types'

export const ReplaceUrl: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'replaceUrl',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,
  onLoad: ({ effect, genRX }) => {
    const rx = genRX()

    const applyReplaceUrl = () => {
      const url = rx<string>()
      const baseUrl = window.location.href
      const fullUrl = new URL(url, baseUrl).toString()
      window.history.replaceState({}, '', fullUrl)
    }

    const cleanup: OnRemovalFn = effect(applyReplaceUrl)

    const updateCallback: AttributeUpdateCallback = () => {
      applyReplaceUrl()
    }

    return [cleanup, updateCallback]
  },
}