import { PluginType, type WatcherPlugin } from '../../../../engine/types';

// Helper function to rewrite internal links with the base path
function rewriteInternalLinks(basePath: string, rootElement: HTMLElement) {
    rootElement.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        if (!href) return;

        // Ignore external links, mailto, tel, etc.
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }

        // Ignore links with target="_blank" or data-native
        if (a.target === '_blank' || a.hasAttribute('data-native')) {
            return;
        }

        // Create a URL object to easily parse the href
        const linkUrl = new URL(href, window.location.origin);

        // Check if the link is internal (same origin)
        if (linkUrl.origin === window.location.origin) {
            let newPathname = linkUrl.pathname;

            // Ensure newPathname starts with a '/'
            if (!newPathname.startsWith('/')) {
                newPathname = '/' + newPathname;
            }

            // If the newPathname does not start with the basePath, prepend it
            if (!newPathname.startsWith(basePath)) {
                // Handle cases where basePath might end with '/' and newPathname starts with '/'
                // e.g., basePath = "/test/", newPathname = "/computed.html" -> "/test/computed.html"
                // e.g., basePath = "/test", newPathname = "/computed.html" -> "/test/computed.html"
                if (basePath.endsWith('/') && newPathname.startsWith('/')) {
                    newPathname = basePath + newPathname.substring(1);
                } else {
                    newPathname = basePath + newPathname;
                }
            }

            // Reconstruct the full href
            const newHref = newPathname + linkUrl.search + linkUrl.hash;

            // Only update if it's actually different to avoid unnecessary DOM writes
            if (a.href !== newHref) {
                a.setAttribute('href', newHref);
            }
        }
    });
}

export const LinkRewriter: WatcherPlugin = {
   type: PluginType.Watcher,
    name: 'linkRewriter',
    onGlobalInit: (ctx) => {
        // Initialize the signal if it doesn't exist
        ctx.signals.merge({ '$router.linksUpdated': 0 }, true);
 
        // Effect to react to changes in $router.linksUpdated signal
        ctx.effect(() => {
            const linksUpdated = ctx.signals.value('$router.linksUpdated');
            // Only proceed if the signal has a value (i.e., it's been initialized)
            if (linksUpdated !== undefined) {
                const routerSignalName = ctx.signals.signal('router') ? 'router' : undefined;
                if (routerSignalName) {
                    const basePath = ctx.signals.value(`${routerSignalName}.basePath`);
                    if (typeof basePath === 'string' && basePath.length > 0) {
                        rewriteInternalLinks(basePath, document.body);
                    }
                }
            }
        });
    },
};