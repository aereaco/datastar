import { type AttributePlugin, PluginType, Requirement, type RuntimeContext } from '../../../engine/types';
import { jsStrToObject } from '../../../utils/text';

interface RouteDefinition {
    path: string;
    component?: string | null;
    handler?: string | null;
    meta?: object | null;
    redirect?: string | null;
    layout?: string | null;
    beforeEnter?: string | null;
    afterEnter?: string | null;
    beforeLeave?: string | null;
    afterLeave?: string | null;
}

export const Route: AttributePlugin = {
    type: PluginType.Attribute,
    name: 'route',
    keyReq: Requirement.Must,
    valReq: Requirement.Denied,

    onLoad(ctx: RuntimeContext) {
    const { el, key: path, signals, runtimeErr } = ctx;
    const pathValue = path; // from data-route="/path"

    const handlerAttr = el.getAttribute('data-route:handler');
    const metaAttr = el.getAttribute('data-route:meta');
    const redirectAttr = el.getAttribute('data-route:redirect');
    const layoutAttr = el.getAttribute('data-route:layout');
    const beforeEnterAttr = el.getAttribute('data-route:before-enter');
    const afterEnterAttr = el.getAttribute('data-route:after-enter');
    const beforeLeaveAttr = el.getAttribute('data-route:before-leave');
    const afterLeaveAttr = el.getAttribute('data-route:after-leave');

    const routeDefinition: RouteDefinition = {
        path: pathValue,
        component: el.getAttribute('data-component'), // For template-based routes
    };

    if (handlerAttr) {
        routeDefinition.handler = handlerAttr;
    }

    if (metaAttr) {
        try {
            routeDefinition.meta = jsStrToObject(metaAttr);
        } catch (e) {
            throw runtimeErr('InvalidRouteMeta', { meta: metaAttr, error: e });
        }
    }

    if (redirectAttr) {
        routeDefinition.redirect = redirectAttr;
    }

    if (layoutAttr) {
        routeDefinition.layout = layoutAttr;
    }

    if (beforeEnterAttr) {
        routeDefinition.beforeEnter = beforeEnterAttr;
    }

    if (afterEnterAttr) {
        routeDefinition.afterEnter = afterEnterAttr;
    }

    if (beforeLeaveAttr) {
        routeDefinition.beforeLeave = beforeLeaveAttr;
    }

    if (afterLeaveAttr) {
        routeDefinition.afterLeave = afterLeaveAttr;
    }

    // Register the route by adding it to the $router.routes signal array
    const routesSignal = signals.signal<RouteDefinition[]>('$router.routes');
    if (!routesSignal) {
        throw runtimeErr('RouterNotInitialized', { message: '$router.routes signal not found' });
    }

    // Ensure the signal is an array before pushing
    if (!Array.isArray(routesSignal.value)) {
        routesSignal.value = [];
    }

    routesSignal.value = [...routesSignal.value, routeDefinition];

    return () => {
        // Cleanup: remove the route from the signal array when the element is destroyed
        routesSignal.value = routesSignal.value.filter((r: RouteDefinition) => r.path !== pathValue);
    };
  }
};
