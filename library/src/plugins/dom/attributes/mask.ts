import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type CleanupUpdateCallback,
  type MutationUpdateCallback,
} from '../../../engine/types'

// Helper functions adapted from AlpineJS's mask plugin
function format(input: string, template: string): string {
  if (input === '') return ''
  const stripped = stripDown(template, input)
  return buildUp(template, stripped)
}

function stripDown(template: string, input: string): string {
  let inputToBeStripped = input
  let output = ''
  const regexes = {
    '9': /[0-9]/,
    'a': /[a-zA-Z]/,
    '*': /[a-zA-Z0-9]/,
  }

  let wildcardTemplate = ''
  for (let i = 0; i < template.length; i++) {
    if (Object.keys(regexes).includes(template[i])) {
      wildcardTemplate += template[i]
      continue
    }
    for (let j = 0; j < inputToBeStripped.length; j++) {
      if (inputToBeStripped[j] === template[i]) {
        inputToBeStripped = inputToBeStripped.slice(0, j) + inputToBeStripped.slice(j + 1)
        break
      }
    }
  }

  for (let i = 0; i < wildcardTemplate.length; i++) {
    let found = false
    for (let j = 0; j < inputToBeStripped.length; j++) {
      if (regexes[wildcardTemplate[i] as keyof typeof regexes].test(inputToBeStripped[j])) {
        output += inputToBeStripped[j]
        inputToBeStripped = inputToBeStripped.slice(0, j) + inputToBeStripped.slice(j + 1)
        found = true
        break
      }
    }
    if (!found) break
  }
  return output
}

function buildUp(template: string, input: string): string {
  let clean = Array.from(input)
  let output = ''
  for (let i = 0; i < template.length; i++) {
    if (!['9', 'a', '* '].includes(template[i])) {
      output += template[i]
      continue
    }
    if (clean.length === 0) break
    output += clean.shift()
  }
  return output
}

function restoreCursorPosition(el: HTMLInputElement, template: string, callback: () => void) {
  const cursorPosition = el.selectionStart
  const unformattedValue = el.value

  callback()

  const beforeLeftOfCursorBeforeFormatting = unformattedValue.slice(0, cursorPosition!)
  const newPosition = buildUp(template, stripDown(template, beforeLeftOfCursorBeforeFormatting)).length

  el.setSelectionRange(newPosition, newPosition)
}

export const Mask: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'mask',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,

  onLoad: ({ el, genRX, effect }) => {
    const inputElement = el as HTMLInputElement
    let lastInputValue = ''
    let currentEffectCleanup: CleanupUpdateCallback = () => {}

    // This function will be called by event listeners
    const eventHandler = (_event: Event) => {
      // Event listeners always restore cursor position
      processInput(true)
    }

    // This function will be called internally
    const processInput = (shouldRestoreCursor: boolean) => {
      const input = inputElement.value

      // If they hit backspace, don't process input.
      if (lastInputValue.length - input.length === 1) {
          lastInputValue = input
          return
      }

      const template = getTemplate()
      if (!template) return

      const setInput = () => {
        lastInputValue = inputElement.value = format(input, template)
        // Dispatch input event to ensure any data-binding plugins are updated
        inputElement.dispatchEvent(new Event('input'))
      }

      if (shouldRestoreCursor) {
        restoreCursorPosition(inputElement, template, () => {
          setInput()
        })
      } else {
        setInput()
      }
    }

    const getTemplate = () => genRX()<string>()

    const setupMask = () => {
      currentEffectCleanup() // Clean up previous effect

      inputElement.removeEventListener('input', eventHandler)
      inputElement.addEventListener('input', eventHandler)
      inputElement.removeEventListener('blur', eventHandler)
      inputElement.addEventListener('blur', eventHandler)

      currentEffectCleanup = effect(() => {
          processInput(true)
      })
    }

    // Initial setup
    setupMask()

    const cleanupCallback: CleanupUpdateCallback = () => {
      inputElement.removeEventListener('input', eventHandler)
      inputElement.removeEventListener('blur', eventHandler)
      currentEffectCleanup()
    }

    const mutationCallback: MutationUpdateCallback = (newValue) => {
      if (newValue !== null) { // Attribute value changed
        setupMask()
      }
      else {
        cleanupCallback()
      }
    }

    return { cleanupCallback, mutationCallback }
  },
}
