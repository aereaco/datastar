import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type CleanupUpdateCallback,
  type MutationUpdateCallback,
} from '../../../../engine/types'

export const If: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'if',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,

  onLoad: ({ el, effect, genRX, runtimeErr, applyToElement }) => {
    if (!(el instanceof HTMLTemplateElement)) {
      throw runtimeErr('IfInvalidElement', { message: 'data-if is only supported on <template> elements.' })
    }

    if (el.content.children.length !== 1) {
      throw runtimeErr('IfInvalidTemplateContent', { message: 'data-if template must contain exactly one root element.' })
    }

    let currentInsertedNodes: Node[] = []
    let currentEffectCleanup: CleanupUpdateCallback = () => {}

    const setupIf = () => {
      currentEffectCleanup() // Clean up previous effect

      currentEffectCleanup = effect(() => {
        const shouldRender = genRX()<boolean>()

        if (shouldRender) {
          if (currentInsertedNodes.length === 0) { // Only insert if not already inserted
            const content = el.content.cloneNode(true) as DocumentFragment
            currentInsertedNodes = Array.from(content.childNodes)
            el.parentNode?.insertBefore(content, el)

            // Apply Nexus-UX plugins to the newly inserted nodes
            currentInsertedNodes.forEach(node => {
              if (node instanceof HTMLElement || node instanceof SVGElement) {
                applyToElement(node);
              }
            });
          }
        } else {
          currentInsertedNodes.forEach(node => node.parentNode?.removeChild(node))
          currentInsertedNodes = []
        }
      })
    }

    // Initial setup
    setupIf()

    const cleanupCallback: CleanupUpdateCallback = () => {
      currentEffectCleanup()
      currentInsertedNodes.forEach(node => node.parentNode?.removeChild(node))
      currentInsertedNodes = []
    }

    const mutationCallback: MutationUpdateCallback = (newValue) => {
      if (newValue !== null) { // Attribute value changed
        setupIf()
      } else { // Attribute removed
        cleanupCallback()
      }
    }

    return { cleanupCallback, mutationCallback }
  },
}
