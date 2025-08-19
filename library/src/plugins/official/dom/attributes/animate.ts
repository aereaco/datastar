import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type MutationUpdateCallback,
  type CleanupUpdateCallback,
} from '../../../../engine/types'

export const Animate: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'animate',
  keyReq: Requirement.Allowed, // Allows data-animate-flip
  valReq: Requirement.Allowed, // Allows optional callback expression for data-sort
  onLoad: (ctx) => {
    const { el: rawEl, key, rx } = ctx;
    const el = rawEl as HTMLElement; // Cast to HTMLElement for DOM manipulation

    // --- FLIP Animation Logic ---
    if (key === 'flip') {
      // This function will be called by data-sort to trigger FLIP animation
      // It expects a Map of initialRects (HTMLElement -> DOMRect) as an argument.
      const performFlip = (initialRects: Map<HTMLElement, DOMRect>) => {
        const currentRect = el.getBoundingClientRect();
        const initialRect = initialRects.get(el);

        if (initialRect && (initialRect.left !== currentRect.left || initialRect.top !== currentRect.top)) {
          const dx = initialRect.left - currentRect.left;
          const dy = initialRect.top - currentRect.top;

          // Apply the inverse transform instantly
          el.style.transition = 'none';
          el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;

          // Force repaint to apply the instant transform
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          el.offsetWidth; 

          // Animate to the final position
          el.style.transition = 'transform 0.3s ease-out'; // TODO: Make duration/easing configurable
          el.style.transform = 'translate3d(0,0,0)';

          // Clean up transform after animation completes
          el.addEventListener('transitionend', function handler() {
            el.style.transition = '';
            el.style.transform = '';
            el.removeEventListener('transitionend', handler);
          }, { once: true });
        }
      };

      // Expose the FLIP function on the element for external triggering (e.g., by data-sort)
      (el as any)._nexusAnimateFlip = performFlip;

      const cleanupCallback: CleanupUpdateCallback = () => {
        delete (el as any)._nexusAnimateFlip;
        el.style.transition = '';
        el.style.transform = '';
      };

      const mutationCallback: MutationUpdateCallback = () => {
        // FLIP is triggered externally, so no internal mutation handling needed here.
      };

      return { cleanupCallback, mutationCallback };
    }

    // --- Class-based Animation Logic (Original data-animate) ---
    const applyClassAnimation = () => {
      const animationClass = rx<string>()
      if (animationClass) {
        el.classList.add(animationClass)
      } else {
        // Remove all animation classes if expression evaluates to falsy
        el.className = el.className.split(' ').filter((c: string) => !c.startsWith('animate-')).join(' ')
      }
    }

    const cleanupClassAnimation: CleanupUpdateCallback = () => {
      el.className = el.className.split(' ').filter((c: string) => !c.startsWith('animate-')).join(' ')
    }

    const mutationClassAnimation: MutationUpdateCallback = () => {
      applyClassAnimation()
    }

    // Initial application for class-based animation
    applyClassAnimation()

    return { cleanupCallback: cleanupClassAnimation, mutationCallback: mutationClassAnimation };
  },
};