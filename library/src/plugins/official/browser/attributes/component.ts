

import {
  type AttributePlugin,
  PluginType,
  Requirement,
} from '../../../../engine/types'

// Global cache for component definition promises to prevent redundant fetches and definitions.
const componentDefinitionCache = new Map<string, Promise<void>>()

// #region Base Component Class
/**
 * Base class for all Datastar components. Provides lifecycle hooks, scoped utilities,
 * and integration with the Datastar reactivity system.
 */
export class DatastarComponent extends HTMLElement {
  // --- Internal properties for Datastar management ---
  _dsCleanupFunctions: (() => void)[] = []
  _dsInstanceId: number = Date.now() + Math.random()
  _dsContentAttached = false
  _componentSrc = ''
  _isShadowDOM = false
  _dsCtx?: Parameters<AttributePlugin['onLoad']>[0] // Context for disconnectedCallback

  // --- Public API for component authors ---
  root: ShadowRoot | this
  internals: ElementInternals

  // Template content is stored here before being attached in connectedCallback
  _templateContent?: DocumentFragment
  _styles?: (HTMLStyleElement | HTMLLinkElement)[]
  _scripts?: HTMLScriptElement[]

  constructor() {
    super()
    this.internals = this.attachInternals()
    // Root is assigned during the definition phase, not here.
  }

  // --- Public Methods for Component Authors ---

  registerCleanup(fn: () => void) {
    if (typeof fn === 'function') this._dsCleanupFunctions.push(fn)
  }

  generateScopedId(baseId: string) {
    return `${this.tagName.toLowerCase()}-${this._dsInstanceId}-${baseId}`
  }

  emit(eventName: string, detail: any) {
    if (!this.root) return
    this.root.dispatchEvent(new CustomEvent(eventName, { bubbles: true, composed: true, detail }))
  }

  setCssVariable(name: string, value: string) {
    this.style.setProperty(name, value)
  }

  getCssVariable(name: string) {
    return getComputedStyle(this).getPropertyValue(name).trim()
  }

  contentReadyCallback() {
    // Intended to be overridden by component authors.
  }

  // --- Lifecycle Callbacks ---

  connectedCallback() {
    if (this._dsContentAttached || !this._dsCtx) return
    this._dsContentAttached = true

    // Attach content from the template
    if (this._templateContent) {
      this.root.appendChild(this._templateContent.cloneNode(true))
    }

    // Apply styles
    if (this._styles) {
      applyStyles(this.root, this._styles, this.tagName.toLowerCase(), this._isShadowDOM)
    }

    // IMPORTANT: Walk the new DOM to initialize Datastar attributes *within* the component
    this._dsCtx.walk(this.root)

    // Execute component-specific scripts
    if (this._scripts) {
      executeScripts(this._dsCtx, this._scripts, this)
    }

    // Finally, call the author's contentReadyCallback
    try {
      this.contentReadyCallback()
    } catch (e) {
      console.error(`[Datastar] Error in contentReadyCallback for <${this.tagName}>:`, e)
    }
  }

  disconnectedCallback() {
    // Declarative cleanup via `data-on-disconnect`
    const disconnectExpr = this.getAttribute('data-on-disconnect')
    if (disconnectExpr && this._dsCtx) {
      try {
        this._dsCtx.evaluate(disconnectExpr)
      } catch (e) {
        console.error(`[Datastar] Error in data-on-disconnect for <${this.tagName}>:`, e)
      }
    }

    // Imperative cleanup via `registerCleanup`
    this._dsCleanupFunctions.forEach((fn) => {
      try {
        fn()
      } catch (e) {
        console.error(`[Datastar] Error during cleanup for <${this.tagName}>:`, e)
      }
    })
    this._dsCleanupFunctions = []
  }
}
// #endregion

// #region Helper Functions

async function getTemplateHtml(ctx: Parameters<AttributePlugin['onLoad']>[0], source: string): Promise<string> {
  // The source itself might be a signal, so we evaluate it.
  const evaluatedSource = ctx.evaluate(source)
  if (typeof evaluatedSource !== 'string' || !evaluatedSource) {
    throw new Error('data-component attribute must resolve to a non-empty string (URL or inline template).')
  }

  // Check if the source is an inline template
  if (evaluatedSource.trim().startsWith('<template>')) {
    return Promise.resolve(evaluatedSource)
  }

  // Otherwise, fetch from the URL
  const response = await fetch(evaluatedSource)
  if (!response.ok) {
    throw new Error(`Failed to fetch component from ${evaluatedSource}: ${response.statusText}`)
  }
  return response.text()
}

function parseComponentHTML(htmlString: string, tagName: string) {
  const doc = new DOMParser().parseFromString(htmlString, 'text/html')
  const templateElement = doc.querySelector('template')
  if (!templateElement) {
    throw new Error(`Component HTML for <${tagName}> must be wrapped in a <template> tag.`)
  }

  const shadowMode = templateElement.getAttribute('shadowroot')
  const formAssociated = templateElement.hasAttribute('data-form-associated')
  const templateContent = templateElement.content
  const styles = Array.from(templateContent.querySelectorAll('style, link[rel="stylesheet"]'))
  const scripts = Array.from(templateContent.querySelectorAll('script'))

  // Remove styles and scripts from the template content to prevent double processing
  styles.forEach((s) => s.remove())
  scripts.forEach((s) => s.remove())

  return { templateContent, styles, scripts, shadowMode, formAssociated }
}

function applyStyles(root: ShadowRoot | HTMLElement, styles: (HTMLStyleElement | HTMLLinkElement)[], tagName: string, isShadowDOM: boolean) {
  if (isShadowDOM && 'adoptedStyleSheets' in (root as ShadowRoot)) {
    const sheets = styles
      .map((styleNode) => {
        if (styleNode.tagName === 'STYLE') {
          try {
            const sheet = new CSSStyleSheet()
            sheet.replaceSync(styleNode.textContent || '')
            return sheet
          } catch (e) {
            console.warn(`[Datastar] Could not construct stylesheet for <${tagName}>. Fallback to appending.`, e)
            return null
          }
        }
        return null
      })
      .filter((s): s is CSSStyleSheet => !!s)
    ;(root as ShadowRoot).adoptedStyleSheets = [...(root as ShadowRoot).adoptedStyleSheets, ...sheets]
  } else {
    styles.forEach((styleNode) => {
      const nodeClone = styleNode.cloneNode(true)
      if (nodeClone.nodeName === 'STYLE' && !isShadowDOM) {
        // Rewrite :host for Light DOM
        nodeClone.textContent = (nodeClone.textContent || '').replace(/:host/g, tagName)
      }
      root.appendChild(nodeClone)
    })
  }
}

function executeScripts(ctx: Parameters<AttributePlugin['onLoad']>[0], scripts: HTMLScriptElement[], componentInstance: DatastarComponent) {
  const componentScope = ctx.signals.scope(componentInstance)
  
  scripts.forEach((scriptNode) => {
    if (scriptNode.hasAttribute('src')) {
      // For external scripts, we just append them. The browser will fetch and execute.
      // Note: These scripts won't have access to the special context variables.
      componentInstance.root.appendChild(scriptNode.cloneNode(true))
      return
    }

    try {
      const scriptFunction = new Function(
        'componentInstance',
        'ds',
        '$signals',
        '$props',
        'emit',
        'registerCleanup',
        'generateScopedId',
        scriptNode.textContent || ''
      )
      scriptFunction.call(
        componentInstance.root,
        componentInstance,
        ctx,
        componentScope,
        componentScope?.$props,
        componentInstance.emit.bind(componentInstance),
        componentInstance.registerCleanup.bind(componentInstance),
        componentInstance.generateScopedId.bind(componentInstance)
      )
    } catch (e) {
      console.error(`[Datastar] Error executing inline script for <${componentInstance.tagName}>:`, e)
    }
  })
}

async function defineComponent(ctx: Parameters<AttributePlugin['onLoad']>[0], el: HTMLElement, componentSrc: string) {
  const tagName = el.tagName.toLowerCase()
  if (customElements.get(tagName)) return

  const htmlContent = await getTemplateHtml(ctx, componentSrc)
  const { templateContent, styles, scripts, shadowMode, formAssociated } = parseComponentHTML(htmlContent, tagName)

  customElements.define(
    tagName,
    class extends DatastarComponent {
      static formAssociated = formAssociated

      constructor() {
        super()
        this._componentSrc = componentSrc
        this._isShadowDOM = !!shadowMode
        this.root = this._isShadowDOM ? this.attachShadow({ mode: shadowMode as ShadowRootMode }) : this
        
        // Pass context and parsed content to the instance for connectedCallback
        this._dsCtx = ctx
        this._templateContent = templateContent
        this._styles = styles
        this._scripts = scripts
      }
    }
  )
}

// #endregion

// #region Main Plugin Logic

export const Component: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'component',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,
  onLoad: (ctx) => {
    const { el, value: componentSrc, signals, effect, evaluate } = ctx

    // Prevent re-initialization
    if ((el as any)._dsComponentInitialized) return
    
    // Handle conditional loading
    const loadIf = el.getAttribute('data-load-if')
    if (loadIf && !evaluate(loadIf)) {
      // If condition is initially false, do nothing.
      // A reactive data-load-if would require a more complex setup with an effect.
      // For now, we evaluate once on load.
      return
    }

    (el as any)._dsComponentInitialized = true
    const tagName = el.tagName.toLowerCase()
    const definitionCacheKey = `${tagName}-${componentSrc}`

    // Setup props reactivity
    const componentScope = signals.scope(el, true)
    const propSignals: { [key: string]: any } = {}
    for (const attr of el.attributes) {
      if (attr.name.startsWith('data-prop-')) {
        const propName = attr.name.substring('data-prop-'.length)
        const propSignal = signals.signal(undefined)
        componentScope[propName] = propSignal
        propSignals[propName] = propSignal
        
        // Effect to keep the prop signal updated reactively
        effect(() => {
          propSignal.value = evaluate(attr.value)
        })
      }
    }
    componentScope.$props = signals.signal(propSignals)

    // Use cache to prevent re-defining the same component
    if (!componentDefinitionCache.has(definitionCacheKey)) {
      const definitionPromise = defineComponent(ctx, el as HTMLElement, componentSrc)
        .catch(error => {
          console.error(`[Datastar] Error defining component <${tagName}> from source "${componentSrc}":`, error)
          const fallbackAttr = el.getAttribute('data-component-fallback')
          if (fallbackAttr) {
            getTemplateHtml(ctx, fallbackAttr)
              .then(fallbackHtml => { el.innerHTML = fallbackHtml })
              .catch(fallbackError => {
                console.error(`[Datastar] Failed to load fallback for <${tagName}>:`, fallbackError)
                el.innerHTML = `<p style="color:red; border:1px solid red; padding: .5em;">Component and fallback failed to load.</p>`
              })
          }
          // Re-throw to allow consumers of the promise to know it failed
          throw error
        })
      componentDefinitionCache.set(definitionCacheKey, definitionPromise)
    }
  },
}
// #endregion
