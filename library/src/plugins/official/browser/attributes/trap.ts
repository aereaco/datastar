import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type CleanupUpdateCallback,
  type MutationUpdateCallback,
} from '../../../../engine/types'

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'details',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export const Trap: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'trap',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,

  onLoad: ({ el, effect, genRX }) => {
    const rx = genRX()

    let lastFocusedElement: HTMLElement | null = null
    let isTrapped = false
    let currentEffectCleanup: CleanupUpdateCallback = () => {}

    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(el.querySelectorAll(FOCUSABLE_SELECTORS)) as HTMLElement[]
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !isTrapped) return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      }
      else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    const activateTrap = () => {
      if (isTrapped) return
      isTrapped = true

      lastFocusedElement = document.activeElement as HTMLElement

      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        // Use a microtask to ensure the element is visible before focusing
        queueMicrotask(() => focusableElements[0].focus())
      }

      document.addEventListener('keydown', handleKeyDown)
    }

    const deactivateTrap = () => {
      if (!isTrapped) return
      isTrapped = false

      document.removeEventListener('keydown', handleKeyDown)

      if (lastFocusedElement) {
        lastFocusedElement.focus()
        lastFocusedElement = null
      }
    }

    const setupTrap = () => { // Removed expressionValue parameter
      currentEffectCleanup() // Clean up previous effect

      currentEffectCleanup = effect(() => {
        const shouldTrap = rx<boolean>()
        if (shouldTrap) {
          activateTrap()
        }
        else {
          deactivateTrap()
        }
      })
    }

    // Initial setup
    setupTrap() // Call without argument

    const cleanupCallback: CleanupUpdateCallback = () => {
      deactivateTrap() // Ensure trap is deactivated on plugin cleanup
      currentEffectCleanup() // Clean up the effect
    }

    const mutationCallback: MutationUpdateCallback = (newValue) => {
      if (newValue !== null) { // Attribute value changed
        setupTrap() // Call without argument
      }
      else {
        cleanupCallback()
      }
    }

    return { cleanupCallback, mutationCallback }
  },
}