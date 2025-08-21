import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type CleanupUpdateCallback,
  type MutationUpdateCallback,
  type RuntimeContext,
} from '../../../../engine/types'
import { addScopeToNode } from '../../../../engine/scope'

// Regular expression to parse "item, index in items" syntax.
const forAliasRE = /(?:([\w$_]+)|\(([\w$_]+)\s*,\s*([\w$_]+)\))\s+in\s+(.*)/

export const For: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'for',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,

  onLoad: (ctx: RuntimeContext) => {
    const { el, value, effect, applyToElement } = ctx

    if (!(el instanceof HTMLTemplateElement)) {
      throw new Error('data-for is only supported on <template> elements.')
    }

    let currentCleanup: CleanupUpdateCallback = () => {}
    let previousNodes: Element[] = []

    const setupLoop = (expression: string) => {
      // Clean up previous effect and nodes
      currentCleanup()
      previousNodes.forEach(node => node.remove())
      previousNodes = []

      const parts = expression.match(forAliasRE)
      if (!parts) {
        throw new Error(`Invalid data-for expression: "${expression}"`);
      }

      const itemsExpression = parts[4].trim()
      const alias = parts[1] || parts[2] || 'item'
      const indexName = parts[3] || 'index'

      const originalCtxValue = ctx.value
      // @ts-ignore
      ctx.value = itemsExpression
      const itemsRx = ctx.rx

      currentCleanup = effect(() => {
        let items: any = itemsRx()

        if (typeof items === 'number' && items >= 0) {
          items = Array.from({ length: items }, (_, i) => i + 1)
        } else if (!Array.isArray(items)) {
          items = []
        }

        const newNodes: Element[] = []
        const parent = el.parentElement
        if (!parent) return

        // This is a simplified loop implementation without keyed diffing.
        // It removes all previous nodes and adds new ones.
        previousNodes.forEach(node => node.remove())

        items.forEach((item: any, index: number) => {
          const templateClone = document.importNode(el.content, true)
          const scope = { [alias]: item, [indexName]: index }

          Array.from(templateClone.children).forEach(childNode => {
            if (childNode instanceof HTMLElement || childNode instanceof SVGElement) {
              addScopeToNode(childNode, scope)
              applyToElement(childNode)
              newNodes.push(childNode)
            }
          })
        })

        newNodes.forEach(node => parent.insertBefore(node, el))
        previousNodes = newNodes
      })

      // @ts-ignore
      ctx.value = originalCtxValue
    }

    // Initial setup
    setupLoop(value)

    const cleanupCallback: CleanupUpdateCallback = () => {
      currentCleanup()
      previousNodes.forEach(node => node.remove())
      previousNodes = []
    }

    const mutationCallback: MutationUpdateCallback = (newValue) => {
      if (newValue !== null) { // Attribute value changed
        setupLoop(newValue)
      } else { // Attribute removed
        cleanupCallback()
      }
    }

    return { cleanupCallback, mutationCallback }
  },
}