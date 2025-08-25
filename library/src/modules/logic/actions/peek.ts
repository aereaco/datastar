// Icon: ion:eye
// Slug: Access signals without subscribing to changes.
// Description: Allows accessing signals without subscribing to their changes in expressions.

import { type ActionPlugin, PluginType } from '../../../engine/types'

export const Peek: ActionPlugin = {
  type: PluginType.Action,
  name: 'peek',
  fn: ({ untracked }, fn: () => any) => {
    return untracked(fn)
  },
}
