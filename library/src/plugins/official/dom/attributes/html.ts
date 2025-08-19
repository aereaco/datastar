import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type CleanupUpdateCallback,
  type MutationUpdateCallback,
} from '../../../../engine/types'

export const Html: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'html',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,

  onLoad: ({ el, effect, genRX }) => {
    const rx = genRX()
    let currentEffectCleanup: CleanupUpdateCallback = () => {}

    const setupHtml = () => {
      currentEffectCleanup() // Clean up previous effect

      currentEffectCleanup = effect(() => {
        const newHtml = rx<string>()
        el.innerHTML = newHtml
      })
    }

    // Initial setup
    setupHtml()

    const cleanupCallback: CleanupUpdateCallback = () => {
      currentEffectCleanup()
    }

    const mutationCallback: MutationUpdateCallback = (newValue) => {
      if (newValue !== null) { // Attribute value changed
        setupHtml() // Re-run setup to re-evaluate expression
      } else { // Attribute removed
        cleanupCallback()
      }
    }

    return { cleanupCallback, mutationCallback }
  },
}