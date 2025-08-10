import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../../engine/types'
import { Signal } from '../../../../vendored/preact-core'

// A global cache to store promises for component definitions. This prevents the same
// component from being fetched and processed multiple times, ensuring custom elements
// are defined only once.
const componentDefinitionCache = new Map<string, Promise<void>>()

// #region Base Component Class
/**
 * Base class for all Nexus-UX components. Provides lifecycle hooks, scoped utilities,
 * and integration with the Nexus-UX reactivity system.
 */
export class BaseComponent extends HTMLElement {
  // --- Internal properties for Nexus-UX management ---
  // Functions to execute when the component is disconnected from the DOM.
  _cleanupFunctions: (() => void)[] = []
  // A unique ID for each component instance, used for scoped IDs.
  _instanceId: number = Date.now() + Math.random()
  // Flag to ensure content is attached only once, especially important for hydration.
  _contentAttached = false
  // The source URL or inline HTML of the component.
  _componentSrc: string | null = null
  // Indicates if the component uses Shadow DOM.
  _isShadowDOM = false
  // Stores the Nexus-UX context for use in lifecycle methods like disconnectedCallback.
  _ctx?: Parameters<AttributePlugin['onLoad']>[0]
  // Flag to prevent double rendering
  _isRendered = false

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

  constructor(ctx: Parameters<AttributePlugin['onLoad']>[0], templateContent?: DocumentFragment, styles?: (HTMLStyleElement | HTMLLinkElement)[], scripts?: HTMLScriptElement[], isShadowDOM?: boolean) {
    super()
    this.internals = this.attachInternals()
    this._ctx = ctx // Assign the passed context

    this._templateContent = templateContent
    this._styles = styles
    this._scripts = scripts
    this._isShadowDOM = !!isShadowDOM

    this.root = this._isShadowDOM ? this.attachShadow({ mode: 'open' }) : this
  }

  // --- Public Methods for Component Authors ---

  /**
   * Registers a function to be called when the component is removed from the DOM.
   * Essential for cleaning up event listeners, timers, or third-party libraries.
   * @param fn The cleanup function to execute.
   */
  registerCleanup(fn: () => void) {
    if (typeof fn === 'function') {
      this._cleanupFunctions.push(fn)
    }
  }

  /**
   * Generates a unique, scoped ID for an element within this component instance.
   * Prevents ID conflicts when multiple instances of the same component are on the page.
   * @param baseId The base ID to make unique (e.g., 'my-input').
   * @returns A globally unique ID string (e.g., 'my-component-1678886400000-my-input').
   */
  generateScopedId(baseId: string) {
    return `${this.tagName.toLowerCase()}-${this._instanceId}-${baseId}`
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
   * Nexus-UX attributes within it have been processed..
   */
  contentReadyCallback() {
    // To be implemented by the component author.
  }

  /**
   * Loads, parses, and renders the component's content from the given source.
   * This method handles clearing existing content and attaching new content, styles, and scripts.
   * It's designed to be called both on initial connection and when the component's source changes dynamically.
   * @param source The URL or inline HTML string for the component.
   */
  async _loadAndRender(source: string) {
    if (!this._ctx) {
      console.error(`[Nexus-UX] Nexus-UX context not available for <${this.tagName}>. Cannot load component source.`)
      return
    }

    try {
      // Clear existing content before rendering new content
      // This is important for dynamic updates to prevent old content from lingering
      if (this.root) {
        while (this.root.firstChild) {
          this.root.removeChild(this.root.firstChild)
        }
      }

      // Update internal properties based on the new source
      this._componentSrc = source

      // Attach the pre-parsed template content to the component's root.
      if (this._templateContent) {
        this.root.appendChild(this._templateContent.cloneNode(true))
      }

      // Apply styles to the component's root.
      if (this._styles) {
        applyStyles(this.root, this._styles, this.tagName.toLowerCase(), this._isShadowDOM)
      }

      // IMPORTANT: Recursively walk the newly attached DOM within the component's root.
      // This initializes all Nexus-UX attributes (data-*, data-on-*, etc.) inside the component.
      if (this._isShadowDOM) {
        Array.from(this.root.children).forEach(child => {
          this._ctx!.applyToElement(child as HTMLElement);
        });
      } else {
        this._ctx.applyToElement(this.root as HTMLElement);
      }

      // Execute component-specific scripts.
      if (this._scripts) {
        executeScripts(this._ctx, this._scripts, this)
      }

      // Finally, call the author's custom contentReadyCallback if it exists.
      try {
        this.contentReadyCallback()
      } catch (e) {
        console.error(`[Nexus-UX] Error in contentReadyCallback for <${this.tagName}>:`, e)
      }
      this._isRendered = true
    } catch (error) {
      console.error(`[Nexus-UX] Error loading and rendering component <${this.tagName}> from source "${source}":`, error)
    }
  }

  // --- Lifecycle Callbacks ---

  /**
   * The standard `connectedCallback` for custom elements. This is where the component's
   * content is attached, styles are applied, scripts are executed, and Nexus-UX's
   * reactivity is initialized within the component's DOM.
   */
  connectedCallback() {
    // Handle declarative `data-component-connected` attribute.
    const connectedExpr = this.getAttribute('data-component:connected')
    if (connectedExpr && this._ctx) {
      try {
        this._ctx.genRX()(connectedExpr)
      } catch (e) {
        console.error(`[Nexus-UX] Error in data-component-connected for <${this.tagName}>:`, e)
      }
    }

    // Prevent re-attaching content if the component is re-connected (e.g., moved in DOM).
    if (this._contentAttached || this._isRendered) return
    this._contentAttached = true

    // On initial connection, load and render the component using its _componentSrc
    if (this._componentSrc) {
      this._loadAndRender(this._componentSrc)
    }
  }

  /**
   * The standard `disconnectedCallback` for custom elements. This is where cleanup
   * functions are executed to prevent memory leaks.
   */
  disconnectedCallback() {
    // Handle declarative cleanup via `data-component:disconnected` attribute.
    const disconnectExpr = this.getAttribute('data-component:disconnected')
    if (disconnectExpr && this._ctx) {
      try {
        // Evaluate the expression in the context of the component instance.
        this._ctx.genRX()(disconnectExpr)
      } catch (e) {
        console.error(`[Nexus-UX] Error in data-on-disconnect for <${this.tagName}>:`, e)
      }
    }

    // Handle imperative cleanup via functions registered with `registerCleanup`.
    this._cleanupFunctions.forEach((fn) => {
      try {
        fn()
      } catch (e) {
        console.error(`[Nexus-UX] Error during imperative cleanup for <${this.tagName}>:`, e)
      }
    })
    this._cleanupFunctions = [] // Clear the array after execution.
  }
}
// #endregion

// #region Helper Functions

/**
 * Intelligently retrieves the component's HTML content. It determines whether the
 * source is an inline template string or a URL to be fetched.
 * @param ctx The Nexus-UX plugin context.
 * @param source The value of the data-component attribute (URL or inline HTML).
 * @returns A promise that resolves with the component's HTML string.
 */
async function getTemplateHtml(ctx: Parameters<AttributePlugin['onLoad']>[0], source: string): Promise<string> {
     // The source itself might be a signal, so we evaluate it reactively.
     let evaluatedSource = source
     if (evaluatedSource.startsWith('$')) {
       try {
         evaluatedSource = ctx.genRX()(evaluatedSource)
       } catch (e) {
         console.error(`[Nexus-UX] Error evaluating dynamic component source "${source}":`, e)
         throw new Error(`Failed to evaluate dynamic component source: ${source}`)
       }
     }
   
     if (typeof evaluatedSource !== 'string' || !evaluatedSource) {
       throw new Error('data-component attribute must resolve to a non-empty string (URL or inline template, or ID reference).')
     }
   
     // Check for fragment identifier
     const hashIndex = evaluatedSource.indexOf('#');
     let urlPart = evaluatedSource;
     let fragmentId: string | null = null;
   
     if (hashIndex !== -1) {
       urlPart = evaluatedSource.substring(0, hashIndex);
       fragmentId = evaluatedSource.substring(hashIndex + 1);
     }
   
     let htmlContent: string;
   
     if (urlPart.trim() === '') {
       // Case: #my-template-id (template on the same page)
       if (!fragmentId) {
         throw new Error('Fragment identifier required for same-page template reference (e.g., "#my-template-id").');
       }
       const templateElement = document.getElementById(fragmentId);
       if (!templateElement || !(templateElement instanceof HTMLTemplateElement)) {
          throw new Error(`[Nexus-UX] Template element with ID "${fragmentId}" not found or is not a <template> element on the current page.`);
       }
       htmlContent = templateElement.outerHTML; // Get the <template> tag itself
     } else if (urlPart.trim().startsWith('<template>')) {
       // Case: Inline template string
       htmlContent = urlPart;
     } else if (urlPart.trim().startsWith('data:')) {
       // Case: Data URL
       const parts = urlPart.split(',');
       if (parts.length < 2) {
         throw new Error(`[Nexus-UX] Invalid Data URL format: ${urlPart}`);
       }
       const metadata = parts[0].substring(5); // Remove "data:" prefix
       const data = parts.slice(1).join(','); // Re-join in case data itself contains commas

       if (metadata.includes('base64')) {
         try {
           htmlContent = atob(data); // Decode base64
         } catch (e) {
           throw new Error(`[Nexus-UX] Failed to decode base64 data from Data URL: ${urlPart}. Error: ${e}`);
         }
       } else {
         htmlContent = decodeURIComponent(data); // Decode URI components for plain text
       }
     } else {
       // Case: URL (with or without fragment)
       console.log(`[Nexus-UX Component] Fetching URL: ${urlPart}`);
       const response = await fetch(urlPart);
       if (!response.ok) {
         throw new Error(`[Nexus-UX] Failed to fetch component from ${urlPart}: ${response.statusText}`);
       }
       htmlContent = await response.text();
     }
   
     // If a fragment ID was specified and content was fetched from a URL, extract the specific template
     if (fragmentId && urlPart.trim() !== '') {
       const tempDoc = new DOMParser().parseFromString(htmlContent, 'text/html');
       // Find the main template element in the fetched document
       const mainTemplate = tempDoc.querySelector('template');
       if (!mainTemplate) {
         throw new Error(`[Nexus-UX] No <template> element found in fetched content from ${urlPart}.`);
       }

       // Now, query within the content of that main template for the specific fragment ID
       const specificTemplate = mainTemplate.content.querySelector(`#${fragmentId}`);
       if (!specificTemplate || !(specificTemplate instanceof HTMLTemplateElement)) {
         throw new Error(`[Nexus-UX] Template with ID "${fragmentId}" not found or is not a <template> element within the main template in fetched content from ${urlPart}.`);
       }
       return specificTemplate.outerHTML; // Return the specific <template> element's outerHTML
     }
   
     return htmlContent; // Return the full HTML content if no fragment or if it was an inline template
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
  let templateElement = doc.querySelector('template')
  let shadowMode: string | null = null;
  let templateContent: DocumentFragment;
  let styles: (HTMLStyleElement | HTMLLinkElement)[];
  let scripts: HTMLScriptElement[];

  if (!templateElement) {
    // If no <template> tag is found, try to use the body content as the template
    // This is a fallback for full HTML pages that are not pure fragments
    console.warn(`[Nexus-UX] No <template> tag found for <${tagName}>. Attempting to use <body> content.`);
    const body = doc.body;
    if (!body) {
      throw new Error(`[Nexus-UX] Could not find <body> or <template> for <${tagName}>.`);
    }
    // Create a new template element and put the body's children into it
    templateElement = document.createElement('template');
    while (body.firstChild) {
      templateElement.content.appendChild(body.firstChild);
    }
    // No shadowMode if we're using body content as template
    shadowMode = null;
  }

  shadowMode = templateElement.getAttribute('shadowrootmode');
  templateContent = templateElement.content;
  styles = Array.from(templateContent.querySelectorAll('style, link[rel="stylesheet"]')) as (HTMLStyleElement | HTMLLinkElement)[];
  scripts = Array.from(templateContent.querySelectorAll('script')) as HTMLScriptElement[];

  // Remove styles and scripts from the template content. They will be processed
  // and appended separately to prevent double processing or incorrect rendering.
  styles.forEach((s) => s.remove())
  scripts.forEach((s) => s.remove())

  return { templateContent, styles, scripts, shadowMode }
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
            console.warn(`[Nexus-UX] Could not construct stylesheet for <${tagName}>. Fallback to appending.`, e)
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
 * executed with a special context, providing access to Nexus-UX's core functions
 * and component-specific utilities.
 * @param ctx The Nexus-UX plugin context.
 * @param scripts An array of script nodes (HTMLScriptElement).
 * @param componentInstance The custom element instance.
 */
function executeScripts(ctx: Parameters<AttributePlugin['onLoad']>[0], scripts: HTMLScriptElement[], componentInstance: BaseComponent) {
  const componentIdPrefix = `${componentInstance.tagName.toLowerCase()}-${componentInstance._instanceId}`;
  const globalContextKey = `__componentContext_${componentInstance._instanceId}`;

  // Create a unique global context object for this component instance
  (window as any)[globalContextKey] = {
    componentInstance,
    ds: ctx,
    $signals: new Proxy(ctx.signals, {
      get(target, prop, receiver) {
        if (typeof prop === 'string' && prop.startsWith('$')) {
          const signalPath = `${componentIdPrefix}.${prop.substring(1)}`;
          return target.signal(signalPath)?.value;
        }
        return Reflect.get(target, prop, receiver);
      }
    }),
    $props: ctx.signals.signal(`${componentIdPrefix}.$props`)?.value,
    emit: componentInstance.emit.bind(componentInstance),
    registerCleanup: componentInstance.registerCleanup.bind(componentInstance),
    generateScopedId: componentInstance.generateScopedId.bind(componentInstance),
    $actions: {} // This will be populated by exported functions
  };

  scripts.forEach(async (scriptNode) => {
    if (scriptNode.hasAttribute('src')) {
      // For external scripts, we just append them. The browser will fetch and execute.
      componentInstance.root.appendChild(scriptNode.cloneNode(true));
      return;
    }

    const scriptContent = scriptNode.textContent || '';
    // Wrap the script content to access the global context and export functions
    const wrappedScriptContent = `
      import { ${globalContextKey} } from 'data:application/javascript;base64,${btoa(`export const ${globalContextKey} = window.${globalContextKey};`)}';

      const componentInstance = ${globalContextKey}.componentInstance;
      const ds = ${globalContextKey}.ds;
      const $signals = ${globalContextKey}.$signals;
      const $props = ${globalContextKey}.$props;
      const emit = ${globalContextKey}.emit;
      const registerCleanup = ${globalContextKey}.registerCleanup;
      const generateScopedId = ${globalContextKey}.generateScopedId;
      const $actions = ${globalContextKey}.$actions; // Reference to the actions object

      // Original script content
      ${scriptContent}
    `;

    try {
      // Create a Blob and then a data URL for the module
      const blob = new Blob([wrappedScriptContent], { type: 'application/javascript' });
      const moduleUrl = URL.createObjectURL(blob);

      // Dynamically import the module
      const module = await import(moduleUrl);

      // Populate $actions with exported functions
      for (const exportName in module) {
        if (typeof module[exportName] === 'function') {
          (window as any)[globalContextKey].$actions[exportName] = module[exportName];
        }
      }

      // Clean up the Blob URL after import
      URL.revokeObjectURL(moduleUrl);

    } catch (e) {
      console.error(`[Nexus-UX] Error executing inline script for <${componentInstance.tagName}>:`, e);
    }
  });

  // Register cleanup for the global context object
  componentInstance.registerCleanup(() => {
    delete (window as any)[globalContextKey];
  });
}

/**
 * Defines a custom element class based on the provided template content and metadata.
 * This function ensures that a custom element is defined only once per tag name.
 * @param ctx The Nexus-UX plugin context.
 * @param el The original HTML element with the data-component attribute.
 * @param componentSrc The source URL or inline HTML of the component.
 * @param formAssociated True if the component is form-associated.
 * @returns A promise that resolves when the custom element class has been defined.
 */
async function defineComponent(
  ctx: Parameters<AttributePlugin['onLoad']>[0],
  el: HTMLElement,
  componentSrc: string | null,
  formAssociated: boolean,
) {
  const tagName = el.tagName.toLowerCase()
  // If the custom element is already defined, return immediately.
  if (customElements.get(tagName)) return

  // If componentSrc is null or empty, there's nothing to define.
  if (!componentSrc) {
    console.warn(`[Nexus-UX] Attempted to define component <${tagName}> with null or empty source. Skipping.`);
    return;
  }

  // Fetch and parse the component's HTML.
  const htmlContent = await getTemplateHtml(ctx, componentSrc)
  const { templateContent, styles, scripts, shadowMode } = parseComponentHTML(htmlContent, tagName)

  // Define the custom element class dynamically.
  customElements.define(
    tagName,
    class extends BaseComponent {
      static formAssociated = formAssociated // Set form association based on template metadata.

      constructor() {
        super(ctx, templateContent, styles, scripts, !!shadowMode) // Pass parsed content to base constructor
        this._componentSrc = componentSrc
      }
    }
  )
}

// #endregion

// #region Main Plugin Logic

/**
 * The main attribute handler for `data-component`. This function is executed by the
 * Nexus-UX engine whenever it encounters the attribute during its `walk` process.
 * It orchestrates the component's definition, reactive property setup, and conditional loading.
 */
export const Component: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'component',
  keyReq: Requirement.Allowed, // data-component does not use a key (e.g., data-component:key)
  valReq: Requirement.Allowed, // data-component does not require a value (the source URL or inline HTML)
  onLoad: (ctx) => {
    const { el, value: initialComponentSrc, signals, effect } = ctx
    const tagName = el.tagName.toLowerCase()

    // If a key is present (e.g., data-component:connected), do nothing.
    // The logic is handled by the custom element's lifecycle callbacks which read these attributes.
    if (ctx.key) return

    // 1. Set up reactive properties (data-signals-*)
    // This section creates signals within the component's scope that are automatically
    // updated whenever the corresponding data-signals-* attribute's expression changes.
    const propSignals: { [key: string]: Signal<any> } = {} // Use Signal<any> for prop values

    // Iterate over all attributes of the element to find data-signals-* attributes.
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('data-signals-')) {
        const propName = attr.name.substring('data-signals-'.length)
        const signalPath = `${tagName}.${propName}`;
        const { signal: propSignal } = signals.upsertIfMissing<any>(signalPath, undefined);
        propSignals[propName] = propSignal;
        
        // Create a Nexus-UX effect to keep this prop signal updated reactively.
        // Whenever the expression in the data-signals-* attribute changes, this effect re-runs.
        effect(() => {
          propSignal.value = ctx.genRX()(attr.value)
        })
      }
    }
    // Expose all reactive properties as a single reactive object under $props on the component's scope.
    // The $props signal itself holds a plain object where keys are prop names and values are the actual signals.
    signals.upsertIfMissing(`${tagName}.$props`, propSignals);

    // 2. Handle component definition and rendering.
    const isFormAssociated = el.hasAttribute('data-component:formAssociated');

    // Auto-inject router params into props if this component is a router outlet
    if (initialComponentSrc.includes('$router.')) {
        effect(() => {
            const routerParams = signals.signal<object>('$router.params')?.value;
            if (routerParams) {
                const propsSignal = signals.signal<object>(`${tagName}.$props`);
                if (propsSignal) {
                    propsSignal.value = { ...propsSignal.value, ...routerParams };
                }
            }
        });
    }

    // Create a signal to hold the resolved component source (static path, inline template, or resolved dynamic signal)
    const { signal: resolvedComponentSourceSignal } = signals.upsertIfMissing<string | null>(`${tagName}._resolvedComponentSource`, initialComponentSrc);

    // Effect to resolve dynamic component sources
    effect(() => {
      const currentComponentSrc = ctx.value;
      if (currentComponentSrc && currentComponentSrc.startsWith('$')) {
        try {
          const resolvedValue = ctx.rx<string | null>();
          if (typeof resolvedValue === 'string') {
            resolvedComponentSourceSignal.value = resolvedValue;
          } else {
            console.warn(`[Nexus-UX] Dynamic component source "${currentComponentSrc}" resolved to a non-string value:`, resolvedValue);
            resolvedComponentSourceSignal.value = null; // Set to null to prevent further errors
          }
        } catch (e) {
          console.error(`[Nexus-UX] Error resolving dynamic component source "${currentComponentSrc}":`, e);
          resolvedComponentSourceSignal.value = null; // Set to null to prevent further errors
        }
      }
      else if (typeof currentComponentSrc === 'string') {
        resolvedComponentSourceSignal.value = currentComponentSrc;
      }
      else {
        resolvedComponentSourceSignal.value = null; // Handle null or non-string initial values
      }
    });

    // Effect to define and render the component when the resolved source changes
    const componentRenderEffect = effect(async () => {
      const currentResolvedSource = resolvedComponentSourceSignal.value;
      if (!currentResolvedSource) return; // Do nothing if source is empty or null

      try {
        const definitionCacheKey = `${tagName}-${currentResolvedSource}`;
        if (!componentDefinitionCache.has(definitionCacheKey)) {
          const definitionPromise = defineComponent(ctx, el as HTMLElement, currentResolvedSource, isFormAssociated)
            .catch(error => {
              console.error(`[Nexus-UX] Error defining component <${tagName}> from source "${currentResolvedSource}":`, error);
              return Promise.reject(error); // Re-reject to be caught by the outer try/catch
            });
          componentDefinitionCache.set(definitionCacheKey, definitionPromise);
        }

        // Wait for the custom element class to be fully defined before proceeding.
        await componentDefinitionCache.get(definitionCacheKey);

        // If the element is already an instance of BaseComponent, trigger re-render
        if (el instanceof BaseComponent) {
          // Re-parse the new source and update the instance's properties
          const htmlContent = await getTemplateHtml(ctx, currentResolvedSource);
          const { templateContent, styles, scripts, shadowMode } = parseComponentHTML(htmlContent, tagName);

          el._templateContent = templateContent;
          el._styles = styles;
          el._scripts = scripts;
          el._isShadowDOM = !!shadowMode;

          el._loadAndRender(currentResolvedSource);
        }
      } catch (error) {
        console.error(`[Nexus-UX] Component <${tagName}> failed to render from source "${currentResolvedSource}":`, error);
        // Do not re-throw, allow other components to render.
      }
    });

    const cleanupCallback: CleanupUpdateCallback = () => {
      componentRenderEffect(); // Disconnect the render effect
      // Additional cleanup logic for the component instance can be added here
      if (el instanceof BaseComponent) {
        el.disconnectedCallback();
      }
    };

    const mutationCallback: MutationUpdateCallback = (newSrc) => {
      // When the data-component attribute itself changes, update the resolved source signal
      resolvedComponentSourceSignal.value = newSrc || null;
    };

    return { cleanupCallback, mutationCallback };
  },
}
// #endregion
