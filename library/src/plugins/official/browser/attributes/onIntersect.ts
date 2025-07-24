import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type AttributeUpdateCallback,
  type OnRemovalFn,
} from '../../../../engine/types'
import { modifyTiming } from '../../../../utils/timing'
import { modifyViewTransition } from '../../../../utils/view-transtions'

export const OnIntersect: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'onIntersect',
  keyReq: Requirement.Denied,
  onLoad: ({ el, rawKey, mods, genRX }) => {
    let observer: IntersectionObserver | null = null
    let currentCleanup: OnRemovalFn = () => {}

    const setupObserver = () => {
      // Disconnect any existing observer before setting up a new one
      if (observer) {
        observer.disconnect()
        observer = null
      }
      currentCleanup() // Clean up any previous effect

      let callback = modifyTiming(genRX(), mods)
      callback = modifyViewTransition(callback, mods)

      const options = { threshold: 0 }
      if (mods.has('full')) {
        options.threshold = 1
      } else if (mods.has('half')) {
        options.threshold = 0.5
      }

      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            callback()

            if (mods.has('once')) {
              observer?.disconnect()
              delete el.dataset[rawKey]
            }
          }
        }
      }, options)
      
      observer.observe(el)

      currentCleanup = () => observer?.disconnect()
    }

    // Initial setup
    setupObserver()

    const cleanup: OnRemovalFn = () => {
      currentCleanup()
    }

    const updateCallback: AttributeUpdateCallback = () => {
      setupObserver()
    }

    return [cleanup, updateCallback]
  },
}