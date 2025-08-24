import { generateId } from '../../../utils/id'
import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type CleanupUpdateCallback,
  type MutationUpdateCallback,
} from '../../../engine/types'

export const Id: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'id',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,

  onLoad: ({ el, value, runtimeErr }) => {
    let currentIdNames: string[] = []

    const setupIds = (expressionValue: string) => {
      // Clean up previous IDs
      if ((el as any)._nexus_ids) {
        currentIdNames.forEach(name => {
          delete (el as any)._nexus_ids[name]
        })
      }

      try {
        const newIdNames = new Function(`return ${expressionValue}`)() as string[]
        if (!Array.isArray(newIdNames)) {
          throw new Error('Value must be an array of strings.')
        }

        if (!(el as any)._nexus_ids) {
          (el as any)._nexus_ids = {}
        }

        newIdNames.forEach(name => {
          (el as any)._nexus_ids[name] = generateId(name)
        })
        currentIdNames = newIdNames
      } catch (e: any) {
        throw runtimeErr('InvalidExpression', { error: e.message })
      }
    }

    // Initial setup
    setupIds(value)

    const cleanupCallback: CleanupUpdateCallback = () => {
      if ((el as any)._nexus_ids) {
        currentIdNames.forEach(name => {
          delete (el as any)._nexus_ids[name]
        })
      }
    }

    const mutationCallback: MutationUpdateCallback = (newValue) => {
      if (newValue !== null) { // Attribute value changed
        setupIds(newValue)
      } else { // Attribute removed
        cleanupCallback()
      }
    }

    return { cleanupCallback, mutationCallback }
  },
}