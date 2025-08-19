import { generateId } from '../../../../utils/id'
import {
  type ActionPlugin,
  PluginType,
  type RuntimeContext,
} from '../../../../engine/types'

const findClosestIdRoot = (el: HTMLElement | null, name: string): number | null => {
  if (!el) return null

  if ((el as any)._nexus_ids && (el as any)._nexus_ids[name]) {
    return (el as any)._nexus_ids[name]
  }

  // Ensure parentElement exists before recursing
  if (!el.parentElement) return null

  return findClosestIdRoot(el.parentElement, name)
}

export const Id: ActionPlugin = {
  type: PluginType.Action,
  name: 'id',
  fn: (ctx: RuntimeContext, name: string, key: string | null = null): string => {
    const { el } = ctx

    // Start search from el.parentElement as data-id is on the element itself
    const rootId = findClosestIdRoot(el.parentElement, name)
    const finalId = rootId ? `${name}-${rootId}` : `${name}-${generateId(name)}`

    return key ? `${finalId}-${key}` : finalId
  },
}