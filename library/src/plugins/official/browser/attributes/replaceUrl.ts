import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
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

    const cleanupCallback: CleanupUpdateCallback = effect(applyReplaceUrl)

    const mutationCallback: MutationUpdateCallback = () => {
      applyReplaceUrl()
    }

    return { cleanupCallback, mutationCallback }
  },
}