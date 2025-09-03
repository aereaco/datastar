import type { HTMLorSVGElement } from './types'
import { Signal } from '../vendored/preact-core' // Added import

export function addScopeToNode(node: HTMLorSVGElement, data: object) {
    // @ts-ignore
    node._nexus_dataStack = [data, ...closestDataStack(node)]

    return () => {
        // @ts-ignore
        node._nexus_dataStack = node._nexus_dataStack.filter(i => i !== data)
    }
}

export function closestDataStack(node: HTMLorSVGElement | null): object[] {
    if (!node) return []
    // @ts-ignore
    if (node._nexus_dataStack) return node._nexus_dataStack

    if (typeof ShadowRoot === 'function' && node instanceof ShadowRoot) {
        // @ts-ignore
        return closestDataStack(node.host)
    }

    if (!node.parentElement) {
        return []
    }

    return closestDataStack(node.parentElement as HTMLorSVGElement)
}

function collapseProxies(this: any) {
    const keys = Reflect.ownKeys(this)
    return keys.reduce((acc, key) => {
        acc[key] = Reflect.get(this, key)
        return acc;
    }, {} as Record<string | symbol, any>)
}

const mergeProxyTrap: ProxyHandler<{ objects: object[] }> = {
    ownKeys({ objects }) {
        return Array.from(
            new Set(objects.flatMap((obj) => {
                // If obj is a Signal, get keys from its value
                if (obj instanceof Signal) {
                    return Object.keys(obj.value);
                }
                return Object.keys(obj);
            }))
        );
    },

    has({ objects }, name) {
        if (name == Symbol.unscopables) return false;

        return objects.some((obj) => {
            if (obj instanceof Signal) {
                // If obj is a Signal, check if its value has the property
                return Reflect.has(obj.value, name);
            }
            return Object.prototype.hasOwnProperty.call(obj, name) || Reflect.has(obj, name);
        });
    },

    get({ objects }, name, thisProxy) {
        if (name == "toJSON") return collapseProxies

        let value: any;
        const foundObj = objects.find((obj) => {
            if (obj instanceof Signal) {
                // If obj is a Signal, check its value for the property
                return Reflect.has(obj.value, name);
            }
            return Reflect.has(obj, name);
        });

        if (foundObj) {
            if (foundObj instanceof Signal) {
                // If the found object is a Signal, get the property from its value
                value = Reflect.get(foundObj.value, name, thisProxy);
            } else {
                value = Reflect.get(foundObj, name, thisProxy);
            }
        } else {
            value = Reflect.get({}, name, thisProxy); // Default to empty object if not found
        }

        // Add signal unwrapping here (for the retrieved value itself)
        if (value instanceof Signal) {
            return value.value;
        }
        return value;
    },

    set({ objects }, name, value) {
        const target = objects.find((obj) => {
            if (obj instanceof Signal) {
                // If obj is a Signal, try to set property on its value
                return Reflect.has(obj.value, name);
            }
            return Object.prototype.hasOwnProperty.call(obj, name);
        }) || objects[objects.length - 1];

        if (target) {
            if (target instanceof Signal) {
                // If the target is a Signal, set the property on its value
                return Reflect.set(target.value, name, value);
            }
            return Reflect.set(target, name, value);
        }

        return false;
    },
};

export function mergeProxies(objects: object[]): object {
    return new Proxy({ objects }, mergeProxyTrap);
}