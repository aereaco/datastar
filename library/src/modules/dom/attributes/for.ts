import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type CleanupUpdateCallback,
  type RuntimeContext,
} from '../../../engine/types'
import { addScopeToNode } from '../../../engine/scope'
import { signal, type Signal } from '../../../vendored/preact-core'

/**
 * Parses the enhanced for-loop expression.
 * New syntax: `(alias) in (source) by (keyExpression)`
 * @param expression The string value of the `data-for` attribute.
 */
function parseForExpression(expression: string) {
  const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
  const byRE = /\s+by\s+([\s\S]*)/;

  const byMatch = expression.match(byRE);
  const keyExpression = byMatch ? byMatch[1].trim() : null;
  const expressionWithoutKey = byMatch ? expression.replace(byRE, '').trim() : expression;

  const inMatch = expressionWithoutKey.match(forAliasRE);
  if (!inMatch) return null;

  const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
  const stripParensRE = /^\s*\(|\)\s*$/g;

  const res = {
    items: inMatch[2].trim(),
    item: '',
    index: 'index',
    collection: 'collection',
    key: keyExpression,
  };

  let aliasString = inMatch[1].replace(stripParensRE, '').trim();
  let iteratorMatch = aliasString.match(forIteratorRE);

  if (iteratorMatch) {
    res.item = aliasString.replace(forIteratorRE, '').trim();
    res.index = iteratorMatch[1].trim();
    if (iteratorMatch[2]) {
      res.collection = iteratorMatch[2].trim();
    }
  } else {
    res.item = aliasString;
  }

  return res;
}

function getIterationScopeVariables(
  iteratorNames: any,
  itemValue: any,
  indexValue: any,
  items: any,
  reactive = false
) {
  const scopeVariables: Record<string, any> = {};

  // Support array destructuring ([foo, bar]).
  if (/^\[.*\]$/.test(iteratorNames.item) && Array.isArray(itemValue)) {
    const names = iteratorNames.item.replace('[', '').replace(']', '').split(',').map((i: string) => i.trim());
    names.forEach((name: string, i: number) => {
      scopeVariables[name] = reactive ? signal(itemValue[i]) : itemValue[i];
    });
  } else if (/^\{.*\}\s*$/.test(iteratorNames.item) && !Array.isArray(itemValue) && typeof itemValue === 'object') {
    // Support object destructuring ({ foo: 'oof', bar: 'rab' }).
    const names = iteratorNames.item.replace('{', '').replace('}', '').split(',').map((i: string) => i.trim());
    names.forEach((name: string) => {
      scopeVariables[name] = reactive ? signal(itemValue[name]) : itemValue[name];
    });
  } else {
    scopeVariables[iteratorNames.item] = reactive ? signal(itemValue) : itemValue;
  }

  scopeVariables[iteratorNames.index] = reactive ? signal(indexValue) : indexValue;
  scopeVariables[iteratorNames.collection] = reactive ? signal(items) : items;

  return scopeVariables;
}

export const For: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'for',
  keyReq: Requirement.Denied,
  valReq: Requirement.Must,

  onLoad: (ctx: RuntimeContext) => {
    const { el, value, effect, applyToElement, runtimeErr } = ctx;

    if (!(el instanceof HTMLTemplateElement)) {
      throw runtimeErr('ForInvalidElement', { message: 'data-for is only supported on <template> elements.' });
    }

    const parts = parseForExpression(value);
    if (!parts) {
      throw runtimeErr('ForInvalidExpression', { expression: value });
    }

    const lookup: Record<string, { element: Element, scope: Record<string, Signal<any>> }> = {};
    let prevKeys: string[] = [];

    const originalValue = ctx.value;
    (ctx as any).value = parts.items;
    const evaluateItems = ctx.genRX();
    (ctx as any).value = originalValue;

    const mainEffect = effect(() => {
      let items: any = evaluateItems();

      // Handle different iteration sources
      if (typeof items === 'number' && items >= 0) {
        items = Array.from({ length: items }, (_, i) => i + 1);
      } else if (typeof items === 'object' && items !== null && !Array.isArray(items)) {
        items = Object.entries(items);
      } else if (!Array.isArray(items)) {
        items = [];
      }

      const newScopes: Record<string, any>[] = [];
      const newKeys: string[] = [];

      // Generate new keys and scopes
      for (let i = 0; i < items.length; i++) {
        const isObjectIteration = typeof items[i] === 'object' && Array.isArray(items[i]) && items[i].length === 2;
        const itemValue = isObjectIteration ? items[i][1] : items[i];
        const indexValue = isObjectIteration ? items[i][0] : i;

        const scope = getIterationScopeVariables(parts, itemValue, indexValue, items);
        newScopes.push(scope);

        let key;
        if (parts.key) {
          // Evaluate key expression within the item's scope
          const keyFn = new Function('scope', `with(scope) { return ${parts.key} }`);
          key = keyFn(scope);
        } else {
          key = indexValue;
          console.warn('Nexus-UX Warning: `data-for` is missing a `by` clause for keying. Using the index as a key. This may lead to performance issues and state loss.', el);
        }

        // Add warning for object keys
        if (typeof key === 'object' && key !== null) {
          runtimeErr('ForInvalidKeyType', { key, message: 'data-for key cannot be an object, it must be a string or an integer.' });
        }

        if (newKeys.includes(key)) {
          runtimeErr('ForDuplicateKey', { key });
        }
        newKeys.push(key);
      }

      // --- Diffing Algorithm ---
      const adds: [string, number][] = [];
      const moves: [string, string][] = [];
      const removes: string[] = [];
      const sames: string[] = [];

      // Identify removals
      for (const key of prevKeys) {
        if (newKeys.indexOf(key) === -1) {
          removes.push(key);
        }
      }

      let currentPrevKeys = [...prevKeys.filter(key => !removes.includes(key))];
      let lastKey = 'template';

      // Identify adds and moves
      for (let i = 0; i < newKeys.length; i++) {
        const key = newKeys[i];
        const prevIndex = currentPrevKeys.indexOf(key);

        if (prevIndex === -1) {
          prevKeys.splice(i, 0, key);
          adds.push([lastKey, i]);
        } else if (prevIndex !== i) {
          const keyInSpot = currentPrevKeys.splice(i, 1)[0];
          const keyForSpot = currentPrevKeys.splice(prevIndex - 1, 1)[0];
          currentPrevKeys.splice(i, 0, keyForSpot);
          currentPrevKeys.splice(prevIndex, 0, keyInSpot);
          moves.push([keyInSpot, keyForSpot]);
        } else {
          sames.push(key);
        }
        lastKey = key;
      }

      // --- Patching ---

      // Process Removals
      for (const key of removes) {
        const { element } = lookup[key];
        element.remove(); // Let the engine's MutationObserver handle cleanup
        delete lookup[key];
      }

      // Process Moves
      for (const [keyInSpot, keyForSpot] of moves) {
        const elInSpot = lookup[keyInSpot].element;
        const elForSpot = lookup[keyForSpot].element;
        const marker = document.createElement('div');

        elForSpot.after(marker);
        elInSpot.after(elForSpot);
        marker.before(elInSpot);
        marker.remove();

        // Refresh scope for the moved element
        const newScopeData = newScopes[newKeys.indexOf(keyForSpot)];
        const existingScope = lookup[keyForSpot].scope;
        for (const scopeKey in newScopeData) {
          if (existingScope[scopeKey]) {
            existingScope[scopeKey].value = newScopeData[scopeKey];
          }
        }
      }

      // Process Adds
      for (const [lastKey, index] of adds) {
        let lastEl = (lastKey === 'template') ? el : lookup[lastKey].element;
        if ((lastEl as any)._ds_if_rendered) {
            lastEl = (lastEl as any)._ds_if_rendered as Element;
        }
        const key = newKeys[index];
        const scopeData = newScopes[index];

        const templateClone = document.importNode(el.content, true);
        const reactiveScope = getIterationScopeVariables(parts, scopeData[parts.item], scopeData[parts.index], items, true);

        const firstChild = templateClone.firstElementChild;
        if (firstChild && (firstChild instanceof HTMLElement || firstChild instanceof SVGElement)) {
          addScopeToNode(firstChild, reactiveScope);
          applyToElement(firstChild);
          lastEl.after(firstChild);
          lookup[key] = { element: firstChild, scope: reactiveScope };
        }
      }

      // Process Sames (Scope Refresh)
      for (const key of sames) {
        const newScopeData = newScopes[newKeys.indexOf(key)];
        const existingScope = lookup[key].scope;
        for (const scopeKey in newScopeData) {
          if (existingScope[scopeKey] && existingScope[scopeKey].value !== newScopeData[scopeKey]) {
            existingScope[scopeKey].value = newScopeData[scopeKey];
          }
        }
      }

      prevKeys = [...newKeys];
    });

    const cleanupCallback: CleanupUpdateCallback = () => {
      mainEffect(); // This disposes the effect
      for (const key in lookup) {
        lookup[key].element.remove();
      }
    };

    return cleanupCallback;
  },
};