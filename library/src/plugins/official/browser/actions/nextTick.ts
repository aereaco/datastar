import { type ActionPlugin, PluginType, type RuntimeContext } from '../../../../engine/types'

export const NextTick: ActionPlugin = {
  type: PluginType.Action,
  name: 'nextTick',
  fn: (_: RuntimeContext, callback: () => void): Promise<void> => {
    return new Promise(resolve => {
      queueMicrotask(() => {
        callback()
        resolve()
      })
    })
  },
}