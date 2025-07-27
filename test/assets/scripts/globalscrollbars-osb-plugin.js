      // Custom Scrollbars :: Start //
      var { OverlayScrollbars, ScrollbarsHidingPlugin, SizeObserverPlugin, ClickScrollPlugin } = OverlayScrollbarsGlobal;

      OverlayScrollbars.plugin([ScrollbarsHidingPlugin, SizeObserverPlugin, ClickScrollPlugin]);

      const scrollableClasses = [ // Your Tailwind classes (or any other classes)
          '.overflow-auto', '.overflow-y-auto', '.overflow-x-auto',
          '.overflow-scroll', '.overflow-y-scroll', '.overflow-x-scroll'
      ];

      const scrollableAttributes = [ // Attributes to trigger initialization
          '[data-overlayscrollbars-initialize]'
      ];

      const osOptions = {
          scrollbars: {
              autoHide: 'move',
              autoHideDelay: 800,
              dragScrolling: true,
              clickScrolling: true,
              touchSupport: true,
              snapHandle: false,
          },
      };

      function initializeOverlayScrollbars(element) {
          if (!element) return;

          let shouldInitialize = false;

          // Check for classes
          if (element.classList) {
              if (scrollableClasses.some(cls => element.classList.contains(cls.substring(1)))) {
                  shouldInitialize = true;
              }
          }

          // Check for attributes
          if (!shouldInitialize) { // Only check attributes if classes didn't match
              if (scrollableAttributes.some(attr => element.matches(attr))) {
                  shouldInitialize = true;
              }
          }

          if (shouldInitialize) {
              try {
                  if (!element.OverlayScrollbarsInitialized) {
                      requestAnimationFrame(() => {
                          element.osInstance = OverlayScrollbars(element, osOptions);
                          element.OverlayScrollbarsInitialized = true;
                      });
                  }
              } catch (error) {
                  console.error('OverlayScrollbars initialization failed:', element, error);
              }
          } else if (element.OverlayScrollbarsInitialized) {
              destroyOverlayScrollbars(element);
          }
      }

      function destroyOverlayScrollbars(element) {
          if (element.OverlayScrollbarsInitialized) {
              if (element.osInstance) {
                  element.osInstance.destroy();
                  delete element.osInstance;
              }
              delete element.OverlayScrollbarsInitialized;
          }
      }

      document.addEventListener('DOMContentLoaded', () => {
          document.querySelectorAll([...scrollableClasses, ...scrollableAttributes].join(',')).forEach(initializeOverlayScrollbars);
      });

      const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
              if (mutation.type === 'childList') {
                  mutation.addedNodes.forEach(node => {
                      if (node instanceof Element) {
                          initializeOverlayScrollbars(node);
                          node.querySelectorAll([...scrollableClasses, ...scrollableAttributes].join(',')).forEach(initializeOverlayScrollbars);
                      }
                  });
                  mutation.removedNodes.forEach(node => {
                      if (node instanceof Element) {
                          destroyOverlayScrollbars(node);
                          node.querySelectorAll([...scrollableClasses, ...scrollableAttributes].join(',')).forEach(destroyOverlayScrollbars);
                      }
                  })
              } else if (mutation.type === 'attributes' && scrollableAttributes.includes(`[${mutation.attributeName}]`)) {
                  initializeOverlayScrollbars(mutation.target);
              } else if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                initializeOverlayScrollbars(mutation.target);
              }
          });
      });

      observer.observe(document.body, { childList: true, subtree: true, attributes: true });

      // Custom Scrollbars :: End //