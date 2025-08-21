import type { HTMLorSVGElement } from './types'

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
            new Set(objects.flatMap((i) => Object.keys(i)))
        )
    },

    has({ objects }, name) {
        if (name == Symbol.unscopables) return false;

        return objects.some((obj) =>
            Object.prototype.hasOwnProperty.call(obj, name) ||
            Reflect.has(obj, name)
        );
    },

    get({ objects }, name, thisProxy) {
        if (name == "toJSON") return collapseProxies

        return Reflect.get(
            objects.find((obj) =>
                Reflect.has(obj, name)
            ) || {},
            name,
            thisProxy
        )
    },

    set({ objects }, name, value) {
        const target = objects.find((obj) =>
                Object.prototype.hasOwnProperty.call(obj, name)
            ) || objects[objects.length - 1];
        
        if (target) {
            return Reflect.set(target, name, value);
        }

        return false;
    },
}

export function mergeProxies(objects: object[]): object {
    return new Proxy({ objects }, mergeProxyTrap);
}
