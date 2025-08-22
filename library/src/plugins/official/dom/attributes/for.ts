import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type CleanupUpdateCallback,
  type MutationUpdateCallback,
  type RuntimeContext,
} from '../../../../engine/types'
import { addScopeToNode } from '../../../../engine/scope'

function parseForExpression(expression: string) {
    const forIteratorRE = /,([^,\}\]]*)$/
    const stripParensRE = /^\s*\(|\)\s*$/g
    const forAliasRE = /([\s\S]*?)\s+in\s+([\s\S]*)/
    const inMatch = expression.match(forAliasRE)

    if (!inMatch) return null

    const res: { items: string; item: string; index: string } = {
        items: inMatch[2].trim(),
        item: '',
        index: 'index', // Default index name
    }

    let aliasString = inMatch[1].replace(stripParensRE, '').trim()

    const iteratorMatch = aliasString.match(forIteratorRE)

    if (iteratorMatch) {
        // Handles "item, index"
        res.item = aliasString.replace(forIteratorRE, '').trim()
        res.index = iteratorMatch[1].trim()
    } else {
        // Handles "item" - the single alias is ALWAYS the item
        res.item = aliasString
    }

    return res
}


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
      currentCleanup()
      previousNodes.forEach(node => node.remove())
      previousNodes = []

      const parts = parseForExpression(expression)
      if (!parts) {
        throw new Error(`Invalid data-for expression: "${expression}"`);
      }

      const itemsExpression = parts.items
      const alias = parts.item
      const indexName = parts.index

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

        previousNodes.forEach(node => node.remove())

        items.forEach((itemValue: any, indexValue: number) => {
          const templateClone = document.importNode(el.content, true)
          const scope = { [alias]: itemValue, [indexName]: indexValue }

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

    setupLoop(value)

    const cleanupCallback: CleanupUpdateCallback = () => {
      currentCleanup()
      previousNodes.forEach(node => node.remove())
      previousNodes = []
    }

    const mutationCallback: MutationUpdateCallback = (newValue) => {
      if (newValue !== null) {
        setupLoop(newValue)
      } else {
        cleanupCallback()
      }
    }

    return { cleanupCallback, mutationCallback }
  },
}