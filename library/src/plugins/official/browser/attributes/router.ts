import {
    type AttributePlugin,
    PluginType,
    Requirement,
    type RuntimeContext,
} from '../../../../engine/types';
import { jsStrToObject } from '../../../../utils/text';
import {
    ROUTER_POPSTATE_EVENT,
    pushState,
    replaceState,
    type RouterPopstateEvent,
} from '../watchers/history';

interface RouteMatchResult {
    matched: boolean;
    params: { [key: string]: string };
    routeDefinition?: any; // To carry the full route definition including hooks and meta
}

let isRouterInitialized = false;
let abortController: AbortController | null = null;

export const Router: AttributePlugin = {
    type: PluginType.Attribute,
    name: 'router',
    keyReq: Requirement.Allowed,
    valReq: Requirement.Allowed,

    onLoad(ctx: RuntimeContext) {
        if (isRouterInitialized || ctx.el.tagName !== 'HTML') return;
        isRouterInitialized = true;

        const { key, value, rx, signals } = ctx;

        let routerSignalName = 'router'; // Default signal name
        console.log(`[Nexus-UX Router] onLoad triggered. routerSignalName: ${routerSignalName}`);
        if (key === 'signal') {
            routerSignalName = rx();
        } else if (value) {
            try {
                const config = jsStrToObject(value);
                if (config && config.signal) {
                    routerSignalName = config.signal;
                }
            } catch (e) {
                console.warn(`[Nexus-UX Router] Could not parse data-router value: ${value}`, e);
            }
        }

        // Initial Router Signal Setup
        signals.merge({
            [routerSignalName]: {
                path: '',
                params: {},
                query: {},
                hash: '',
                loading: false,
                error: null,
                previous: {},
                layout: null,
                route: null,
                meta: {},
                scrollPosition: { x: 0, y: 0 },
                routes: [],
                default: null,
                mode: 'hybrid',
            }
        }, true);

        // Base Path Detection
        let basePath = '/';
        const manualBasePath = document.documentElement.getAttribute('data-router.base-path');
        if (manualBasePath !== null) {
            basePath = manualBasePath;
        } else {
            const pathname = window.location.pathname;
            const lastSlashIndex = pathname.lastIndexOf('/');
            const lastSegment = pathname.substring(lastSlashIndex + 1);

            if (lastSegment.includes('.')) {
                basePath = pathname.substring(0, lastSlashIndex + 1);
            } else {
                basePath = pathname.endsWith('/') ? pathname : pathname + '/';
            }
        }
        signals.merge({ [routerSignalName]: { basePath: basePath } });

        // Helper function to execute route hooks
        async function executeHook(
            hookString: string | null | undefined,
            hookCtx: { signals: any; params: any; query: any; abortController: AbortController | null; currentRoute?: any; previousRoute?: any }
        ): Promise<boolean | string> {
            if (!hookString) {
                return true; // No hook, proceed
            }
            try {
                const hookFn = new Function('ctx', `return (${hookString})(ctx)`);
                const result = await Promise.resolve(hookFn(hookCtx));
                return result;
            } catch (e) {
                console.error(`[Nexus-UX Router] Error executing hook: ${hookString}`, e);
                signals.merge({ [routerSignalName]: { error: { type: 'hook_error', message: `Error in hook: ${hookString}` } } });
                return false; // Stop navigation on hook error
            }
        }

        function routeMatcher(urlPath: string, routePathPattern: string): RouteMatchResult {
            const paramNames: string[] = [];
            const regexPath = routePathPattern
                .replace(/\/(:[^/]+)\?/g, '(?:/([^/]+))?') // Optional params like /:id?
                .replace(/:([^/]+)/g, (_: any, paramName: string) => { // Required params like /:id
                    paramNames.push(paramName);
                    return '([^/]+)';
                })
                .replace(/\*$/, '(.*)'); // Wildcard

            const regex = new RegExp(`^${regexPath}$`);
            const match = urlPath.match(regex);

            if (match) {
                const params: { [key: string]: string } = {};
                paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });

                if (routePathPattern.endsWith('*')) {
                    params['wildcard'] = match[paramNames.length + 1];
                }

                return { matched: true, params };
            }

            return { matched: false, params: {} };
        }

        function navigate(url: string, options?: { replace?: boolean }) {
            queueMicrotask(async () => {
                console.log(`[Nexus-UX Router] Navigating to: ${url}, replace: ${options?.replace}`);
                const scrollY = window.scrollY;
                
                abortController = new AbortController();

                const currentRouteMeta = signals.value(`${routerSignalName}.meta`) as any;
                if (currentRouteMeta && currentRouteMeta.beforeLeave) {
                    const hookContext = {
                        signals: signals,
                        params: signals.value(`${routerSignalName}.params`),
                        query: signals.value(`${routerSignalName}.query`),
                        abortController: abortController,
                        currentRoute: signals.value(`${routerSignalName}.route`),
                        previousRoute: signals.value(`${routerSignalName}.previous.meta`)
                    };
                    const hookResult = await executeHook(currentRouteMeta.beforeLeave, hookContext);
                    if (hookResult === false) {
                        console.log(`[Nexus-UX Router] beforeLeave hook returned false, stopping navigation.`);
                        signals.merge({ [routerSignalName]: { loading: false } });
                        return;
                    } else if (typeof hookResult === 'string') {
                        console.log(`[Nexus-UX Router] beforeLeave hook redirected to: ${hookResult}`);
                        navigate(hookResult, { replace: true });
                        return;
                    }
                }
                
                const currentBasePath = signals.value(`${routerSignalName}.basePath`);
                console.log(`[Nexus-UX Router] currentBasePath: ${currentBasePath}`);

                const fullPath = currentBasePath + url.substring(1);
                console.log(`[Nexus-UX Router] fullPath: ${fullPath}`);

                if (options?.replace) {
                    replaceState(fullPath, { scrollY });
                } else {
                    pushState(fullPath, { scrollY });
                }
                resolveAndLoadRoute(url, abortController, routerSignalName);
            });
        }

        let isResolving = false;
        async function resolveAndLoadRoute(url: string, currentAbortController: AbortController | null, routerSignalName: string) {
            if (isResolving) return;
            isResolving = true;

            try {
                await new Promise(resolve => queueMicrotask(() => resolve(null)));
            
                console.log(`[Nexus-UX Router] Resolving route for URL: ${url}`);
                signals.merge({ [routerSignalName]: { loading: true } });

                const urlObject = new URL(url, window.location.origin);
                let currentPathname = urlObject.pathname;

                const basePath = (signals.value(`${routerSignalName}.basePath`) ?? '/') as string;
                if (currentPathname.startsWith(basePath)) {
                    currentPathname = currentPathname.substring(basePath.length - 1);
                }

                if (!currentPathname.startsWith('/')) {
                    currentPathname = '/' + currentPathname;
                }

                const isInitialLoad = !signals.value(`$${routerSignalName}.path`);
                const isRootPath = currentPathname === '/' || currentPathname.endsWith('/index.html') || currentPathname === '';
                const defaultRoute = signals.value(`$${routerSignalName}.default`);

                if (isInitialLoad && isRootPath && defaultRoute) {
                    signals.merge({ [routerSignalName]: { path: '/', route: defaultRoute, loading: false } });
                    return;
                }

                const previousRouteMeta = signals.value(`$${routerSignalName}.meta`);
                const previousPath = signals.value(`$${routerSignalName}.path`);

                try {
                    const queryParams: { [key: string]: string } = {};
                    urlObject.searchParams.forEach((value, key) => {
                        queryParams[key] = value;
                    });

                    let routeDetails: {
                        componentUrl: string | null;
                        layoutUrl: string | null;
                        params: { [key: string]: string };
                        handler: string | null;
                        meta: object | null;
                        beforeEnter: string | null;
                        afterEnter: string | null;
                        beforeLeave: string | null;
                        afterLeave: string | null;
                    } = { componentUrl: null, layoutUrl: null, params: {}, handler: null, meta: {}, beforeEnter: null, afterEnter: null, beforeLeave: null, afterLeave: null };

                    const explicitRoutes = (signals.value(`${routerSignalName}.routes`) ?? []) as any[];
                    const routingMode = signals.value(`$${routerSignalName}.mode`) || 'hybrid';
                    const isInternalResource = currentPathname.startsWith('/_components/') || currentPathname.startsWith('/_layouts/');

                    if ((routingMode === 'signal' || routingMode === 'hybrid') && !isInternalResource) {
                        for (const route of explicitRoutes) {
                            const matchResult = routeMatcher(currentPathname, route.path);
                            if (matchResult.matched) {
                                routeDetails = {
                                    componentUrl: route.component,
                                    layoutUrl: route.layout || null,
                                    params: matchResult.params,
                                    handler: route.handler || null,
                                    meta: route.meta || {},
                                    beforeEnter: route.beforeEnter || null,
                                    afterEnter: route.afterEnter || null,
                                    beforeLeave: route.beforeLeave || null,
                                    afterLeave: route.afterLeave || null,
                                };
                                break;
                            }
                        }
                    }

                    if (!routeDetails.componentUrl && (routingMode === 'static' || routingMode === 'hybrid') && !isInternalResource) {
                        let potentialFilePath = currentPathname;
                        if (potentialFilePath.endsWith('/')) {
                            potentialFilePath += 'index.html';
                        } else if (!potentialFilePath.includes('.')) {
                            potentialFilePath += '.html';
                        }
                        if (potentialFilePath.startsWith('/')) {
                            potentialFilePath = potentialFilePath.substring(1);
                        }
                        try {
                            const response = await fetch(basePath + potentialFilePath);
                            if (response.ok) {
                                routeDetails = {
                                    componentUrl: basePath + potentialFilePath,
                                    layoutUrl: null,
                                    params: {},
                                    handler: null,
                                    meta: {},
                                    beforeEnter: null, afterEnter: null, beforeLeave: null, afterLeave: null
                                };
                            }
                        } catch (fetchError) {
                            console.error("[Nexus-UX Router] Error fetching file-system route:", fetchError);
                        }
                    }

                    if (routeDetails.componentUrl) {
                        if (routeDetails.beforeEnter) {
                            const hookContext = {
                                signals: signals,
                                params: routeDetails.params,
                                query: queryParams,
                                abortController: currentAbortController,
                                currentRoute: routeDetails.componentUrl,
                                previousRoute: previousRouteMeta
                            };
                            const hookResult = await executeHook(routeDetails.beforeEnter, hookContext);
                            if (hookResult === false) {
                                signals.merge({ [routerSignalName]: { loading: false } });
                                return;
                            } else if (typeof hookResult === 'string') {
                                navigate(hookResult, { replace: true });
                                return;
                            }
                        }

                        if (routeDetails.handler) {
                            const hookContext = {
                                signals: signals,
                                params: routeDetails.params,
                                query: queryParams,
                                abortController: currentAbortController,
                                currentRoute: routeDetails.componentUrl,
                                previousRoute: previousRouteMeta
                            };
                            const handlerResult = await executeHook(routeDetails.handler, hookContext);
                            if (handlerResult === false) {
                                signals.merge({ [routerSignalName]: { loading: false } });
                                return;
                            } else if (typeof handlerResult === 'string') {
                                navigate(handlerResult, { replace: true });
                                return;
                            }
                        }

                        const newState = {
                            path: currentPathname,
                            hash: urlObject.hash,
                            query: queryParams,
                            layout: routeDetails.layoutUrl,
                            route: routeDetails.componentUrl,
                            params: routeDetails.params,
                            meta: routeDetails.meta || {},
                            error: null,
                            previous: { path: previousPath, meta: previousRouteMeta },
                            loading: false
                        };
                        signals.merge({ [routerSignalName]: newState });

                        queueMicrotask(async () => {
                            const savedScrollY = window.history.state?.scrollY;
                            if (savedScrollY !== undefined && savedScrollY !== null) {
                                window.scrollTo(0, savedScrollY);
                                signals.merge({ [routerSignalName]: { scrollPosition: { x: 0, y: savedScrollY } } });
                            } else if (urlObject.hash) {
                                const targetElement = document.getElementById(urlObject.hash.substring(1));
                                if (targetElement) {
                                    targetElement.scrollIntoView();
                                    signals.merge({ [routerSignalName]: { scrollPosition: { x: window.scrollX, y: window.scrollY } } });
                                }
                            }
                            else {
                                window.scrollTo(0, 0);
                                signals.merge({ [routerSignalName]: { scrollPosition: { x: 0, y: 0 } } });
                            }

                            const newRouteMeta = signals.value(`$${routerSignalName}.meta`) as any;
                            if (newRouteMeta && newRouteMeta.afterEnter) {
                                const hookContext = {
                                    signals: signals,
                                    params: signals.value(`$${routerSignalName}.params`),
                                    query: signals.value(`$${routerSignalName}.query`),
                                    abortController: currentAbortController,
                                    currentRoute: signals.value(`$${routerSignalName}.route`),
                                    previousRoute: previousRouteMeta
                                };
                                await executeHook(newRouteMeta.afterEnter, hookContext);
                            }

                            const prevRouteMeta = previousRouteMeta as any;
                            if (prevRouteMeta && prevRouteMeta.afterLeave && signals.value(`$${routerSignalName}.path`) !== previousPath) {
                                const hookContext = {
                                    signals: signals,
                                    params: signals.value(`$${routerSignalName}.params`),
                                    query: signals.value(`$${routerSignalName}.query`),
                                    abortController: currentAbortController,
                                    currentRoute: signals.value(`$${routerSignalName}.route`),
                                    previousRoute: prevRouteMeta
                                };
                                await executeHook(prevRouteMeta.afterLeave, hookContext);
                            }
                        });
                    } else {
                        signals.merge({ [routerSignalName]: { error: { type: '404', message: 'Page not found' }, route: '/404.html', loading: false } });
                        if (currentPathname !== '/404.html') {
                            navigate('/404.html', { replace: true });
                        }
                    }

                } catch (e: any) {
                    console.error("Error resolving route:", e);
                    signals.merge({ [routerSignalName]: { error: { type: 'error', message: e.message }, loading: false } });
                }
            } finally {
                isResolving = false;
            }
        }

        // Expose navigate function globally
        (window as any).$router = {
            ...((window as any).$router || {}),
            navigate: (url: string, options?: { replace?: boolean }) => {
                navigate(url, options);
            },
        };
        
        // Setup event listeners
        const popstateListener = (e: CustomEvent<RouterPopstateEvent>) => {
            resolveAndLoadRoute(e.detail.url, new AbortController(), routerSignalName);
        };
        document.addEventListener(ROUTER_POPSTATE_EVENT, popstateListener);

        const clickListener = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a');
            if (target && target.href && !target.hasAttribute('data-native') && target.target !== '_blank') {
                const targetUrl = new URL(target.href);
                if (targetUrl.origin === window.location.origin) {
                    e.preventDefault();
                    let relativeHref = target.pathname;
                    const basePath = (signals.value(`${routerSignalName}.basePath`) ?? '/') as string;
                    if (relativeHref.startsWith(basePath)) {
                        relativeHref = relativeHref.substring(basePath.length - 1);
                    }
                    navigate(relativeHref + targetUrl.search + targetUrl.hash);
                }
            }
        };
        document.addEventListener('click', clickListener);

        // Handle initial configuration from the data-router attribute
        if (key) {
            const config = { [routerSignalName]: { [key]: rx() } };
            signals.merge(config);
        } else if (value) {
            const config = { [routerSignalName]: rx() };
            signals.merge(config);
        }

        // Handle initial page load
        queueMicrotask(() => {
            resolveAndLoadRoute(window.location.href, new AbortController(), routerSignalName);
        });
    }
};
