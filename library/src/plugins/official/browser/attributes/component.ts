import {
  type AttributePlugin,
  PluginType,
  Requirement,
} from '../../../../engine/types'
import { Signal } from '../../../../vendored/preact-core'

// A global cache to store promises for component definitions. This prevents the same
// component from being fetched and processed multiple times, ensuring custom elements
// are defined only once.
const componentDefinitionCache = new Map<string, Promise<void>>()

// #region Base Component Class
/**
 * Base class for all Datastar components. Provides lifecycle hooks, scoped utilities,
 * and integration with the Datastar reactivity system.
 */
export class DatastarComponent extends HTMLElement {
  // --- Internal properties for Datastar management ---
  // Functions to execute when the component is disconnected from the DOM.
  _dsCleanupFunctions: (() => void)[] = []
  // A unique ID for each component instance, used for scoped IDs.
  _dsInstanceId: number = Date.now() + Math.random()
  // Flag to ensure content is attached only once, especially important for hydration.
  _dsContentAttached = false
  // The source URL or inline HTML of the component.
  _componentSrc = ''
  // Indicates if the component uses Shadow DOM.
  _isShadowDOM = false
  // Stores the Datastar context for use in lifecycle methods like disconnectedCallback.
  _dsCtx?: Parameters<AttributePlugin['onLoad']>[0]

  // --- Public properties ---
  // The root where the component's content is rendered (ShadowRoot or the element itself).
  root: ShadowRoot | this
  // Provides access to the element's form-associated capabilities.
  internals: ElementInternals

  // These properties hold the parsed content, styles, and scripts from the component's template.
  // They are populated during the component definition phase and used in connectedCallback.
  _templateContent?: DocumentFragment
  _styles?: (HTMLStyleElement | HTMLLinkElement)[]
  _scripts?: HTMLScriptElement[]

  constructor() {
    super()
    this.internals = this.attachInternals()
    this.root = this // Initialize root to 'this' to satisfy strictPropertyInitialization
  }

  // --- Public Methods for Component Authors ---

  /**
   * Registers a function to be called when the component is removed from the DOM.
   * Essential for cleaning up event listeners, timers, or third-party libraries.
   * @param fn The cleanup function to execute.
   */
  registerCleanup(fn: () => void) {
    if (typeof fn === 'function') {
      this._dsCleanupFunctions.push(fn)
    }
  }

  /**
   * Generates a unique, scoped ID for an element within this component instance.
   * Prevents ID conflicts when multiple instances of the same component are on the page.
   * @param baseId The base ID to make unique (e.g., 'my-input').
   * @returns A globally unique ID string (e.g., 'my-component-1678886400000-my-input').
   */
  generateScopedId(baseId: string) {
    return `${this.tagName.toLowerCase()}-${this._dsInstanceId}-${baseId}`
  }

  /**
   * Dispatches a custom event from the component's root. Events are configured
   * to bubble up and cross Shadow DOM boundaries by default.
   * @param eventName The name of the custom event.
   * @param detail The data to pass with the event, accessible via `event.detail`.
   */
  emit(eventName: string, detail: any) {
    if (!this.root) return
    const event = new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail,
    })
    this.root.dispatchEvent(event)
  }

  /**
   * Sets a CSS custom property (variable) on the component's host element.
   * @param name The name of the CSS variable (e.g., '--primary-color').
   * @param value The value to set.
   */
  setCssVariable(name: string, value: string) {
    this.style.setProperty(name, value)
  }

  /**
   * Gets the computed value of a CSS custom property from the component's host element.
   * @param name The name of the CSS variable.
   * @returns The computed value of the CSS variable.
   */
  getCssVariable(name: string) {
    return getComputedStyle(this).getPropertyValue(name).trim()
  }

  /**
   * A lifecycle hook intended for developers to override in their component's script.
   * It's called after the component's template has been attached and all initial
   * Datastar attributes within it have been processed.
   */
  contentReadyCallback() {
    // To be implemented by the component author.
  }

  // --- Lifecycle Callbacks ---

  /**
   * The standard `connectedCallback` for custom elements. This is where the component's
   * content is attached, styles are applied, scripts are executed, and Datastar's
   * reactivity is initialized within the component's DOM.
   */
  connectedCallback() {
    // Handle declarative `data-component-connected` attribute.
    const connectedExpr = this.getAttribute('data-component-connected')
    if (connectedExpr && this._dsCtx) {
      try {
        this._dsCtx.genRX()(connectedExpr)
      } catch (e) {
        console.error(`[Datastar] Error in data-component-connected for <${this.tagName}>:`, e)
      }
    }

    // Prevent re-attaching content if the component is re-connected (e.g., moved in DOM).
    if (this._dsContentAttached || !this._dsCtx) return
    this._dsContentAttached = true

    // Attach the pre-parsed template content to the component's root.
    if (this._templateContent) {
      this.root.appendChild(this._templateContent.cloneNode(true))
    }

    // Apply styles to the component's root.
    if (this._styles) {
      applyStyles(this.root, this._styles, this.tagName.toLowerCase(), this._isShadowDOM)
    }

    // IMPORTANT: Recursively walk the newly attached DOM within the component's root.
    // This initializes all Datastar attributes (data-*, data-on-*, etc.) inside the component.
    if (this._isShadowDOM) {
      // When using Shadow DOM, the content is appended to this.root (the ShadowRoot).
      // We need to apply Datastar to the elements *inside* the ShadowRoot.
      // The applyToElement function expects an Element, not a ShadowRoot.
      // So, we iterate over the children of the ShadowRoot.
      Array.from(this.root.children).forEach(child => {
        this._dsCtx!.applyToElement(child as HTMLElement); // Cast to HTMLElement
      });
    } else {
      // For Light DOM, this.root is the custom element itself, which is an HTMLElement.
      this._dsCtx.applyToElement(this.root as HTMLElement); // Cast to HTMLElement
    }

    // Execute component-specific scripts.
    if (this._scripts) {
      executeScripts(this._dsCtx, this._scripts, this)
    }

    // Finally, call the author's custom contentReadyCallback if it exists.
    try {
      this.contentReadyCallback()
    } catch (e) {
      console.error(`[Datastar] Error in contentReadyCallback for <${this.tagName}>:`, e)
    }
  }

  /**
   * The standard `disconnectedCallback` for custom elements. This is where cleanup
   * functions are executed to prevent memory leaks.
   */
  disconnectedCallback() {
    // Handle declarative cleanup via `data-on-disconnect` attribute.
    const disconnectExpr = this.getAttribute('data-on-disconnect')
    if (disconnectExpr && this._dsCtx) {
      try {
        // Evaluate the expression in the context of the component instance.
        this._dsCtx.genRX()(disconnectExpr) // Use genRX() for evaluation
      } catch (e) {
        console.error(`[Datastar] Error in data-on-disconnect for <${this.tagName}>:`, e)
      }
    }

    // Handle imperative cleanup via functions registered with `registerCleanup`.
    this._dsCleanupFunctions.forEach((fn) => {
      try {
        fn()
      } catch (e) {
        console.error(`[Datastar] Error during imperative cleanup for <${this.tagName}>:`, e)
      }
    })
    this._dsCleanupFunctions = [] // Clear the array after execution.
  }
}
// #endregion

// #region Helper Functions

/**
 * Intelligently retrieves the component's HTML content. It determines whether the
 * source is an inline template string or a URL to be fetched.
 * @param ctx The Datastar plugin context.
 * @param source The value of the data-component attribute (URL or inline HTML).
 * @returns A promise that resolves with the component's HTML string.
 */
async function getTemplateHtml(source: string): Promise<string> {
  // The source itself might be a signal, so we evaluate it reactively.
  const evaluatedSource = source
  if (typeof evaluatedSource !== 'string' || !evaluatedSource) {
    throw new Error('data-component attribute must resolve to a non-empty string (URL or inline template).')
  }

  // Check if the source is an inline template (starts with <template> tag).
  if (evaluatedSource.trim().startsWith('<template>')) {
    return Promise.resolve(evaluatedSource)
  }

  // Otherwise, fetch the content from the provided URL.
  const response = await fetch(evaluatedSource)
  if (!response.ok) {
    throw new Error(`Failed to fetch component from ${evaluatedSource}: ${response.statusText}`)
  }
  return response.text()
}

/**
 * Parses the component's HTML string to extract the template content, styles,
 * scripts, and metadata (shadow mode, form association).
 * @param htmlString The raw HTML content of the component.
 * @param tagName The custom element's tag name (for error reporting).
 * @returns An object containing the parsed elements and metadata.
 * @throws Error if no <template> tag is found.
 */
function parseComponentHTML(htmlString: string, tagName: string) {
  const doc = new DOMParser().parseFromString(htmlString, 'text/html')
  const templateElement = doc.querySelector('template')
  if (!templateElement) {
    throw new Error(`Component HTML for <${tagName}> must be wrapped in a <template> tag.`)
  }

  const shadowMode = templateElement.getAttribute('shadowroot')
  const formAssociated = templateElement.hasAttribute('data-component-form-associated') // FIX: Changed to data-component-form-associated
  const templateContent = templateElement.content
  const styles = Array.from(templateContent.querySelectorAll('style, link[rel="stylesheet"]')) as (HTMLStyleElement | HTMLLinkElement)[];
  const scripts = Array.from(templateContent.querySelectorAll('script')) as HTMLScriptElement[];

  // Remove styles and scripts from the template content. They will be processed
  // and appended separately to prevent double processing or incorrect rendering.
  styles.forEach((s) => s.remove())
  scripts.forEach((s) => s.remove())

  return { templateContent, styles, scripts, shadowMode, formAssociated }
}

/**
 * Applies styles to the component's root. It prioritizes Constructable Stylesheets
 * for Shadow DOM for optimal performance and falls back to appending <style> tags.
 * For Light DOM, it rewrites :host selectors to the component's tag name.
 * @param root The component's root (ShadowRoot or HTMLElement).
 * @param styles An array of style nodes (HTMLStyleElement or HTMLLinkElement).
 * @param tagName The custom element's tag name.
 * @param isShadowDOM True if the component uses Shadow DOM.
 */
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
      .filter((s): s is CSSStyleSheet => !!s) // Filter out nulls
    ;(root as ShadowRoot).adoptedStyleSheets = [...(root as ShadowRoot).adoptedStyleSheets, ...sheets]
  } else {
    styles.forEach((styleNode) => {
      const nodeClone = styleNode.cloneNode(true) as HTMLStyleElement | HTMLLinkElement
      if (nodeClone.nodeName === 'STYLE' && !isShadowDOM) {
        // For Light DOM, rewrite :host for Light DOM
        nodeClone.textContent = (nodeClone.textContent || '').replace(/:host/g, tagName)
      }
      root.appendChild(nodeClone)
    })
  }
}

/**
 * Safely executes scripts found within a component's template. Inline scripts are
 * executed with a special context, providing access to Datastar's core functions
 * and component-specific utilities.
 * @param ctx The Datastar plugin context.
 * @param scripts An array of script nodes (HTMLScriptElement).
 * @param componentInstance The custom element instance.
 */
function executeScripts(ctx: Parameters<AttributePlugin['onLoad']>[0], scripts: HTMLScriptElement[], componentInstance: DatastarComponent) {
  // Get the Datastar signal scope associated with this component instance.
  // The `scope` method is not directly on SignalsRoot. We'll use the element's ID for namespacing.
  const componentIdPrefix = `${componentInstance.tagName.toLowerCase()}-${componentInstance._dsInstanceId}`;
  
  scripts.forEach((scriptNode) => {
    if (scriptNode.hasAttribute('src')) {
      // For external scripts, we just append them. The browser will fetch and execute.
      // Note: These scripts won't have access to the special context variables
      // unless they explicitly access them via the global window object.
      componentInstance.root.appendChild(scriptNode.cloneNode(true))
      return
    }

    try {
      // Create a new Function from the script's content. This allows us to
      // inject specific variables into the script's scope.
      const scriptFunction = new Function(
        'componentInstance', // The custom element instance itself.
        'ds',                // The Datastar core context (ctx).
        '$signals',          // The signal scope for this component.
        '$props',            // Reactive properties passed to the component.
        'emit',              // Component's emit method.
        'registerCleanup',   // Component's registerCleanup method.
        'generateScopedId',  // Component's generateScopedId method.
        '$actions',          // New: Injected actions object
        scriptNode.textContent || '' // The actual JavaScript code.
      )

      // Object to hold dynamically registered actions from this script
      const componentActions: { [key: string]: Function } = {};
      const exportFunctionRegex = /export\s+function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
      let match;

      // Extract and register exported functions as actions
      while ((match = exportFunctionRegex.exec(scriptNode.textContent || '')) !== null) {
        const actionName = match[1];
        const args = match[2];
        const body = match[3];

        // Create a function that has access to the component's context
        const actionFn = new Function(
          'componentInstance', 'ds', '$signals', '$props', 'emit', 'registerCleanup', 'generateScopedId', 'args', 'body',
          `return function(${args}) { ${body} }`
        ).call(null, componentInstance, ctx, 
          new Proxy(ctx.signals, { // Re-create proxy for action's scope
            get(target, prop, receiver) {
              if (typeof prop === 'string' && prop.startsWith('$')) {
                const signalPath = `${componentIdPrefix}.${prop.substring(1)}`;
                return target.signal(signalPath)?.value;
              }
              return Reflect.get(target, prop, receiver);
            }
          }),
          ctx.signals.signal(`${componentIdPrefix}.$props`)?.value,
          componentInstance.emit.bind(componentInstance),
          componentInstance.registerCleanup.bind(componentInstance),
          componentInstance.generateScopedId.bind(componentInstance),
          args, body
        );
        componentActions[actionName] = actionFn;
      }

      // Call the main script function, binding 'this' to the component's root and passing the context variables.
      scriptFunction.call(
        componentInstance.root,
        componentInstance,
        ctx,
        // Pass a proxy or a subset of signals relevant to this component's scope
        new Proxy(ctx.signals, {
          get(target, prop, receiver) {
            if (typeof prop === 'string' && prop.startsWith('$')) {
              // Handle $signals.mySignal -> ctx.signals.signal(componentIdPrefix + '.mySignal').value
              const signalPath = `${componentIdPrefix}.${prop.substring(1)}`;
              return target.signal(signalPath)?.value;
            }
            return Reflect.get(target, prop, receiver);
          }
        }),
        // $props will be a signal containing other signals, so access its value
        ctx.signals.signal(`${componentIdPrefix}.$props`)?.value,
        componentInstance.emit.bind(componentInstance),
        componentInstance.registerCleanup.bind(componentInstance),
        componentInstance.generateScopedId.bind(componentInstance),
        componentActions // Pass the new $actions object
      )
    } catch (e) {
      console.error(`[Datastar] Error executing inline script for <${componentInstance.tagName}>:`, e)
    }
  })
}

/**
 * Defines a custom element class based on the provided template content and metadata.
 * This function ensures that a custom element is defined only once per tag name.
 * @param ctx The Datastar plugin context.
 * @param el The original HTML element with the data-component attribute.
 * @param componentSrc The source URL or inline HTML of the component.
 * @returns A promise that resolves when the custom element class has been defined.
 */
async function defineComponent(ctx: Parameters<AttributePlugin['onLoad']>[0], el: HTMLElement, componentSrc: string) {
  const tagName = el.tagName.toLowerCase()
  // If the custom element is already defined, return immediately.
  if (customElements.get(tagName)) return

  // Fetch and parse the component's HTML.
  const htmlContent = await getTemplateHtml(componentSrc)
  const { templateContent, styles, scripts, shadowMode, formAssociated } = parseComponentHTML(htmlContent, tagName)

  // Define the custom element class dynamically.
  customElements.define(
    tagName,
    class extends DatastarComponent {
      static formAssociated = formAssociated // Set form association based on template metadata.

      constructor() {
        super()
        this._componentSrc = componentSrc
        this._isShadowDOM = !!shadowMode
        // Attach Shadow DOM if specified, otherwise use the element itself as the root.
        this.root = this._isShadowDOM ? this.attachShadow({ mode: shadowMode as ShadowRootMode }) : this
        
        // Store the Datastar context and parsed content on the instance for use in connectedCallback.
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

/**
 * The main attribute handler for `data-component`. This function is executed by the
 * Datastar engine whenever it encounters the attribute during its `walk` process.
 * It orchestrates the component's definition, reactive property setup, and conditional loading.
 */
export const Component: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'component',
  keyReq: Requirement.Allowed, // data-component does not use a key (e.g., data-component:key)
  valReq: Requirement.Must,   // data-component requires a value (the source URL or inline HTML)
  onLoad: (ctx) => {
    const { el, value: componentSrc, signals, effect } = ctx
    const tagName = el.tagName.toLowerCase()
    const definitionCacheKey = `${tagName}-${componentSrc}`

    // Generate a unique prefix for signals scoped to this component instance.
    // This ensures that each component instance has its own isolated set of signals.
    const componentIdPrefix = `${tagName}-${el.id || componentSrc.replace(/[^a-zA-Z0-9]/g, '')}`;

    // 1. Set up reactive properties (data-signals-*)
    // This section creates signals within the component's scope that are automatically
    // updated whenever the corresponding data-signals-* attribute's expression changes.
    const propSignals: { [key: string]: Signal<any> } = {} // Use Signal<any> for prop values

    // Iterate over all attributes of the element to find data-signals-* attributes.
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('data-signals-')) {
        const propName = attr.name.substring('data-signals-'.length)
        const signalPath = `${componentIdPrefix}.${propName}`;
        const { signal: propSignal } = signals.upsertIfMissing<any>(signalPath, undefined);
        propSignals[propName] = propSignal;
        
        // Create a Datastar effect to keep this prop signal updated reactively.
        // Whenever the expression in the data-signals-* attribute changes, this effect re-runs.
        effect(() => {
          propSignal.value = ctx.genRX()(attr.value)
        })
      }
    }
    // Expose all reactive properties as a single reactive object under $props on the component's scope.
    // The $props signal itself holds a plain object where keys are prop names and values are the actual signals.
    signals.upsertIfMissing(`${componentIdPrefix}.$props`, propSignals);

    // 2. Handle component definition and rendering.
    // This logic is now unconditional, as conditional loading is handled by `data-show` on a wrapper.
    if (!componentDefinitionCache.has(definitionCacheKey)) {
      const definitionPromise = defineComponent(ctx, el as HTMLElement, componentSrc)
        .catch(error => {
          console.error(`[Datastar] Error defining component <${tagName}> from source "${componentSrc}":`, error)
          // If definition fails, check for a fallback attribute and try to render its content.
          const fallbackAttr = el.getAttribute('data-component-fallback')
          if (fallbackAttr) {
            getTemplateHtml(fallbackAttr)
                  .then(fallbackHtml => { el.innerHTML = fallbackHtml })
                  .catch(fallbackError => {
                    console.error(`[Datastar] Failed to load fallback for <${tagName}>:`, fallbackError)
                    // If fallback also fails, display a generic error message.
                    el.innerHTML = `<p style="color:red; border:1px solid red; padding: .5em;">Component and fallback failed to load.</p>`
                  })
              }
              throw error // Re-throw the error to propagate it further if needed.
            })
          componentDefinitionCache.set(definitionCacheKey, definitionPromise)
        }

        // Wait for the custom element class to be fully defined before proceeding.
        // This ensures that when the element is connected, its custom element definition is ready.
        effect(async () => {
          await componentDefinitionCache.get(definitionCacheKey)
        });
      },
    }
// #endregion
