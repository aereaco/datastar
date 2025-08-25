// Icon: material-symbols:resize-outline
// Slug: Runs an expression when the element is resized.
// Description: Runs an expression whenever the element on which the attribute is placed is resized.

import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
  type ResizeUpdateCallback,
} from '../../../engine/types'
import { modifyTiming } from '../../../utils/timing'
import { modifyViewTransition } from '../../../utils/view-transtions'

export const OnResize: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'onResize',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,
  observesResize: true,
  onLoad: ({ mods, genRX }) => {
    let callback = modifyTiming(genRX(), mods)
    callback = modifyViewTransition(callback, mods)

    const resizeCallback: ResizeUpdateCallback = (entry) => {
      callback(entry)
    }

    const cleanupCallback: CleanupUpdateCallback = () => {
      // Cleanup is handled by the engine's ResizeObserverService
    }

    const mutationCallback: MutationUpdateCallback = () => {
      // Re-evaluate the callback if the attribute changes
      callback = modifyTiming(genRX(), mods)
      callback = modifyViewTransition(callback, mods)
    }

    return { cleanupCallback, mutationCallback, resizeCallback }
  },
}