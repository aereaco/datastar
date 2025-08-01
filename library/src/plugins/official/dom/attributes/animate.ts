// Icon: material-symbols:animation-outline
// Slug: Controls CSS animations on an element.
// Description: Adds or removes CSS classes to control animations based on an expression.

import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../../engine/types'

export const Animate: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'animate',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,
  onLoad: ({ el, rx }) => {
    const applyAnimation = () => {
      const animationClass = rx<string>()
      if (animationClass) {
        el.classList.add(animationClass)
      } else {
        // If the expression evaluates to a falsy value, remove all animation classes
        // This assumes animation classes are distinct and can be removed without affecting other classes
        // A more robust solution might require a predefined list of animation classes
        el.className = el.className.split(' ').filter((c: string) => !c.startsWith('animate-')).join(' ')
      }
    }

    const cleanupCallback: CleanupUpdateCallback = () => {
      // On cleanup, remove any animation classes applied by this plugin
      el.className = el.className.split(' ').filter((c: string) => !c.startsWith('animate-')).join(' ')
    }

    const mutationCallback: MutationUpdateCallback = () => {
      // Re-evaluate the animation class if the attribute changes
      applyAnimation()
    }

    // Initial application
    applyAnimation()

    return { cleanupCallback, mutationCallback }
  },
}
