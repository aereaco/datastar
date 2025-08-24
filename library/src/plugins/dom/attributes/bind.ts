import { runtimeErr } from '../../../engine/errors'
import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../engine/types'
import { modifyCasing, trimDollarSignPrefix } from '../../../utils/text'

const dataURIRegex = /^data:(?<mime>[^;]+);base64,(?<contents>.*)$/
const updateEvents = ['change', 'input', 'keydown']

export const Bind: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'bind',
  keyReq: Requirement.Exclusive,
  valReq: Requirement.Exclusive,
  onLoad: (ctx) => {
    const { el, key, mods, signals, value, effect } = ctx
    const input = el as HTMLInputElement

    let currentCleanupCallback: CleanupUpdateCallback | undefined

    const setupBinding = (currentSignalName: string) => {
      // Clean up any existing binding before setting up a new one
      if (currentCleanupCallback) {
        currentCleanupCallback()
      }

      const tnl = el.tagName.toLowerCase()
      const isInput = tnl.includes('input')
      const isSelect = tnl.includes('select')
      const type = el.getAttribute('type')
      const hasValueAttribute = el.hasAttribute('value')

      let signalDefault: string | boolean | number | File = ''
      const isCheckbox = isInput && type === 'checkbox'
      if (isCheckbox) {
        signalDefault = hasValueAttribute ? '' : false
      }
      const isNumber = isInput && type === 'number'
      if (isNumber) {
        signalDefault = 0
      }
      const isRadio = isInput && type === 'radio'
      if (isRadio) {
        const name = el.getAttribute('name')
        if (!name?.length) {
          el.setAttribute('name', currentSignalName)
        }
      }
      const isFile = isInput && type === 'file'

      const { signal, inserted } = signals.upsertIfMissing(
        currentSignalName,
        signalDefault,
      )

      let arrayIndex = -1
      if (Array.isArray(signal.value)) {
        if (el.getAttribute('name') === null) {
          el.setAttribute('name', currentSignalName)
        }
        arrayIndex = [
          ...document.querySelectorAll(`[name="${currentSignalName}"]`),
        ].findIndex((el) => el === ctx.el)
      }
      const isArray = arrayIndex >= 0

      const signalArray = () => [...(signals.value(currentSignalName) as any[])]

      const setElementFromSignal = () => {
        let value = signals.value(currentSignalName)
        if (isArray && !isSelect) {
          value = (value as any)[arrayIndex] || signalDefault
        }
        const stringValue = `${value}`
        if (isCheckbox || isRadio) {
          if (typeof value === 'boolean') {
            input.checked = value
          } else {
            input.checked = stringValue === input.value
          }
        } else if (isSelect) {
          const select = el as HTMLSelectElement
          if (select.multiple) {
            if (!isArray) {
              throw runtimeErr('BindSelectMultiple', ctx)
            }
            for (const opt of select.options) {
              if (opt?.disabled) return
              const incoming = isNumber ? Number(opt.value) : opt.value
              opt.selected = (value as any[]).includes(incoming)
            }
          } else {
            select.value = stringValue
          }
        } else if (isFile) {
          // File input reading from a signal is not supported
        } else if ('value' in el) {
          el.value = stringValue
        } else {
          el.setAttribute('value', stringValue)
        }
      }

      const setSignalFromElement = async () => {
        let currentValue = signals.value(currentSignalName)
        if (isArray) {
          const currentArray = currentValue as any[]
          while (arrayIndex >= currentArray.length) {
            currentArray.push(signalDefault)
          }
          currentValue = currentArray[arrayIndex] || signalDefault
        }

        const update = (sName: string, val: any) => {
          let newValue = val
          if (isArray && !isSelect) {
            newValue = signalArray()
            newValue[arrayIndex] = val
          }
          signals.setValue(sName, newValue)
        }

        if (isFile) {
          const files = [...(input?.files || [])]
          const allContents: string[] = []
          const allMimes: string[] = []
          const allNames: string[] = []

          await Promise.all(
            files.map((f) => {
              return new Promise<void>((resolve) => {
                const reader = new FileReader()
                reader.onload = () => {
                  if (typeof reader.result !== 'string') {
                    throw runtimeErr('InvalidFileResultType', ctx, {
                      resultType: typeof reader.result,
                    })
                  }
                  const match = reader.result.match(dataURIRegex)
                  if (!match?.groups) {
                    throw runtimeErr('InvalidDataUri', ctx, {
                      result: reader.result,
                    })
                  }
                  allContents.push(match.groups.contents)
                  allMimes.push(match.groups.mime)
                  allNames.push(f.name)
                }
                reader.onloadend = () => resolve(void 0)
                reader.readAsDataURL(f)
              })
            }),
          )
          update(currentSignalName, allContents)
          update(`${currentSignalName}Mimes`, allMimes)
          update(`${currentSignalName}Names`, allNames)
          return
        }

        const val = input.value || ''
        let newValue: any

        if (isCheckbox) {
          const checked =
            input.checked || input.getAttribute('checked') === 'true'

          // We must check for an attribute value because a checked value defaults to `on`.
          if (hasValueAttribute) {
            newValue = checked ? val : ''
          } else {
            newValue = checked
          }
        } else if (isSelect) {
          const select = el as HTMLSelectElement
          const selectedOptions = [...select.selectedOptions]
          if (isArray) {
            newValue = selectedOptions
              .filter((opt) => opt.selected)
              .map((opt) => opt.value)
          } else {
            newValue = selectedOptions[0]?.value || signalDefault
          }
        } else if (typeof currentValue === 'boolean') {
          newValue = Boolean(val)
        } else if (typeof currentValue === 'number') {
          newValue = Number(val)
        } else {
          newValue = val || ''
        }

        update(currentSignalName, newValue)
      }

      if (inserted) {
        setSignalFromElement()
      }

      for (const event of updateEvents) {
        el.addEventListener(event, setSignalFromElement)
      }

      const onPageshow = (ev: PageTransitionEvent) => {
        if (!ev.persisted) return
        setSignalFromElement()
      }
      window.addEventListener('pageshow', onPageshow)

      const reset = effect(() => setElementFromSignal())

      return () => {
        reset()
        for (const event of updateEvents) {
          el.removeEventListener(event, setSignalFromElement)
        }
        window.removeEventListener('pageshow', onPageshow)
      }
    }

    // Initial setup
    const initialSignalName = key
      ? modifyCasing(key, mods)
      : trimDollarSignPrefix(value)
    currentCleanupCallback = setupBinding(initialSignalName)

    const cleanupCallback: CleanupUpdateCallback = () => {
      if (currentCleanupCallback) {
        currentCleanupCallback()
      }
    }

    const mutationCallback: MutationUpdateCallback = (newAttrValue) => {
      const newSignalName = key
        ? modifyCasing(key, mods)
        : trimDollarSignPrefix(newAttrValue || '')

      if (newSignalName !== initialSignalName) {
        currentCleanupCallback = setupBinding(newSignalName)
      } else {
        // If the signal name hasn't changed, just re-sync the element from the signal
        // This handles cases where the signal's value might have changed externally
        // and the element needs to reflect that change.
        const signal = signals.signal(newSignalName);
        if (signal) {
          const setElementFromSignal = () => {
            let val = signals.value(newSignalName);
            // Re-apply the value to the element based on its type
            if (input.type === 'checkbox' || input.type === 'radio') {
              input.checked = (input.type === 'checkbox' && typeof val === 'boolean') ? val : (String(val) === input.value);
            } else if ('value' in el) {
              (el as HTMLInputElement).value = String(val);
            } else {
              el.setAttribute('value', String(val));
            }
          };
          setElementFromSignal();
        }
      }
    }

    return { cleanupCallback, mutationCallback }
  },
}