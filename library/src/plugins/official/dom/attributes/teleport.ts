import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type CleanupUpdateCallback,
  type MutationUpdateCallback,
} from '../../../../engine/types'

export const Teleport: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'teleport',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,

  onLoad: ({ el, value, applyToElement, runtimeErr }) => {
    if (!(el instanceof HTMLTemplateElement)) {
      throw new Error('data-teleport is only supported on <template> elements.')
    }

    let currentTeleportedNodes: Element[] = [] // Changed from Node[] to Element[]

    const setupTeleport = (selector: string) => {
      // Clean up previously teleported nodes
      currentTeleportedNodes.forEach(node => node.remove())
      currentTeleportedNodes = []

      const targetElement = document.querySelector(selector)

      if (!targetElement) {
        throw runtimeErr('Invalid selector for data-teleport', { selector });
      }

      const content = el.content.cloneNode(true) as DocumentFragment
      // Filter to ensure only Element nodes are processed and stored
      const newTeleportedNodes = Array.from(content.childNodes).filter((node): node is Element => node instanceof Element)

      targetElement.append(content)

      // Apply plugins to the newly teleported content
      newTeleportedNodes.forEach(node => {
        if (node instanceof HTMLElement || node instanceof SVGElement) {
          applyToElement(node)
        }
      })
      currentTeleportedNodes = newTeleportedNodes
    }

    // Initial setup
    setupTeleport(value)

    const cleanupCallback: CleanupUpdateCallback = () => {
      currentTeleportedNodes.forEach(node => node.remove())
      currentTeleportedNodes = []
    }

    const mutationCallback: MutationUpdateCallback = (newValue) => {
      if (newValue !== null) { // Attribute value changed
        setupTeleport(newValue)
      } else { // Attribute removed
        cleanupCallback()
      }
    }

    return { cleanupCallback, mutationCallback }
  },
}