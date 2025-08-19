import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type CleanupUpdateCallback,
  type MutationUpdateCallback,
} from '../../../../engine/types'

// Regular expression to parse "item in items" syntax.
const forAliasRE = /((.*) in)? *(.*)/

// Regular expression to strip parentheses from an expression.
const stripParensRE = /^\s*\(|\)\s*$/g

export const For: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'for',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,

  onLoad: ({ el, value, effect, rx, signals }) => {
    if (!(el instanceof HTMLTemplateElement)) {
      throw new Error('data-for is only supported on <template> elements.')
    }

    let currentCleanup: CleanupUpdateCallback = () => {}
    let currentItemsExpression: string = ''
    let currentAlias: string = ''
    let previousNodes: Element[] = [] // Changed from Node[] to Element[]

    const setupLoop = (expression: string) => {
      // Clean up previous effect and nodes
      currentCleanup()
      previousNodes.forEach(node => node.remove())
      previousNodes = []

      const parts = expression.match(forAliasRE)
      if (!parts) {
        throw new Error(`Invalid data-for expression: "${expression}"`);
      }

      currentItemsExpression = parts[3].trim()
      currentAlias = parts[2] ? parts[2].trim().replace(stripParensRE, '') : 'item'
      const indexName = 'index' // Default index name

      const render = () => {
        const items = rx<any[]>()

        const newNodes: Element[] = [] // Changed from Node[] to Element[]
        const parent = el.parentElement
        if (!parent) return

        items.forEach((item, index) => {
          const templateClone = document.importNode(el.content, true)
          const itemRoot = templateClone.firstElementChild

          if (itemRoot) {
            // Inject item and index into a new scope for this iteration
            // This is a simplified concept. A real implementation would need
            // to properly manage nested scopes and reactivity.
            const itemScope = { [currentAlias]: item, [indexName]: index };
            (itemRoot as any).__scope = itemScope; // This is a placeholder for proper scope injection

            // A real implementation would need to recursively apply plugins
            // to the new nodes within this new scope.
            // For now, we'll just append.
            newNodes.push(itemRoot)
          }
        });

        // Basic diffing: remove all old nodes and add new ones.
        // A real implementation would use a keyed diffing algorithm for performance.
        previousNodes.forEach(node => node.remove());
        newNodes.forEach(node => parent.insertBefore(node, el));
        previousNodes = newNodes;
      }

      currentCleanup = effect(() => {
        signals.upsertIfMissing(currentItemsExpression, [])
        render()
      })
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