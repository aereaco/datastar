import {
  type AttributePlugin,
  PluginType,
  Requirement,
  type RuntimeContext,
  type CleanupUpdateCallback,
} from '../../../../engine/types'
import { jsStrToObject } from '../../../../utils/text'

// Module-level state for drag operations
const globalDragState = {
  isDragging: false,
  draggedItem: null as HTMLElement | null,
  draggedItemKey: null as string | null,
  sourceContainer: null as HTMLElement | null,
  targetContainer: null as HTMLElement | null,
  ghostElement: null as HTMLElement | null,
  placeholderElement: null as HTMLElement | null,
  initialRects: new Map<HTMLElement, DOMRect>(),
  group: null as string | null,
  pullMode: 'true' as 'true' | 'false' | 'clone',
};

export const Sort: AttributePlugin = {
  type: PluginType.Attribute,
  name: 'sort',
  keyReq: Requirement.Denied,
  valReq: Requirement.Allowed,
  argNames: ['$itemKey', '$newIndex'],

  onLoad: (ctx: RuntimeContext): CleanupUpdateCallback => {
    const { el: container, value: callbackExpression, genRX, applyToElement } = ctx;

    const config = jsStrToObject(container.getAttribute('data-sort-config') || '{}');
    const groupConfig = container.getAttribute('data-sort-group');

    let groupName: string | null = null;
    let pullMode: 'true' | 'false' | 'clone' = 'true';

    if (groupConfig) {
        const parts = groupConfig.split(':');
        groupName = parts[0];
        const pullMatch = groupConfig.match(/pull\((true|false|clone)\)/);
        if (pullMatch) pullMode = pullMatch[1] as 'true' | 'false' | 'clone';
    }

    const getDraggableItems = () => Array.from(container.children).filter(
      child => child.hasAttribute('data-sort-item')
    ) as HTMLElement[];

    const handleDragStart = (e: Event) => {
      const dragEvent = e as DragEvent;
      const target = dragEvent.target as HTMLElement;
      if (!target.hasAttribute('data-sort-item') || (config.filter && target.matches(config.filter))) {
        dragEvent.preventDefault();
        return;
      }
      
      const handle = target.querySelector('[data-sort-handle]');
      if (handle && !handle.contains(dragEvent.target as Node)) {
          dragEvent.preventDefault();
          return;
      }

      globalDragState.isDragging = true;
      globalDragState.draggedItem = target;
      globalDragState.draggedItemKey = target.getAttribute('data-sort-item');
      globalDragState.sourceContainer = container as HTMLElement;
      globalDragState.group = groupName;
      globalDragState.pullMode = pullMode;

      dragEvent.dataTransfer!.effectAllowed = 'move';
      dragEvent.dataTransfer!.setData('text/plain', globalDragState.draggedItemKey!);

      globalDragState.initialRects.clear();
      const allItems = document.querySelectorAll('[data-sort-item][data-animate-flip]');
      allItems.forEach(item => {
        globalDragState.initialRects.set(item as HTMLElement, item.getBoundingClientRect());
      });

      setTimeout(() => {
        target.classList.add(config.dragClass || 'is-dragging');
      }, 0);

      globalDragState.ghostElement = target.cloneNode(true) as HTMLElement;
      globalDragState.ghostElement.classList.add(config.ghostClass || 'sortable-ghost');
      document.body.appendChild(globalDragState.ghostElement);
      updateGhostPosition(dragEvent);
    };

    const handleDrag = (e: Event) => {
        const dragEvent = e as DragEvent;
        if (!globalDragState.isDragging) return;
        updateGhostPosition(dragEvent);
    };

    const handleDragEnd = () => {
        if (!globalDragState.isDragging) return;
        cleanupDragState();
    };

    const handleDragOver = (e: Event) => {
        const dragEvent = e as DragEvent;
        if (!globalDragState.isDragging) return;
        dragEvent.preventDefault();

        const targetContainer = container as HTMLElement;
        const targetGroupConfig = targetContainer.getAttribute('data-sort-group');
        let targetGroupName: string | null = null;
        let targetPutMode = true;

        if (targetGroupConfig) {
            const putMatch = targetGroupConfig.match(/put\((true|false)\)/);
            if (putMatch) targetPutMode = putMatch[1] === 'true';
            targetGroupName = targetGroupConfig.split(':')[0];
        }

        const isCompatible = (globalDragState.group === null && targetGroupName === null) || (globalDragState.group !== null && globalDragState.group === targetGroupName);

        if (!isCompatible || !targetPutMode) {
            dragEvent.dataTransfer!.dropEffect = 'none';
            return;
        }
        dragEvent.dataTransfer!.dropEffect = 'move';

        targetContainer.classList.add(config.dragOverClass || 'drag-over');
        globalDragState.targetContainer = targetContainer;

        if (!globalDragState.placeholderElement) {
            const dragged = globalDragState.draggedItem!;
            globalDragState.placeholderElement = document.createElement(dragged.tagName);
            globalDragState.placeholderElement.classList.add(config.placeholderClass || 'sortable-placeholder');
            const rect = dragged.getBoundingClientRect();
            globalDragState.placeholderElement.style.width = `${rect.width}px`;
            globalDragState.placeholderElement.style.height = `${rect.height}px`;
        }
        
        const placeholder = globalDragState.placeholderElement!;
        const { newIndex } = getNewIndex(dragEvent, targetContainer);
        const refElement = targetContainer.children[newIndex];
        
        if (refElement !== placeholder) {
            targetContainer.insertBefore(placeholder, refElement);
        }
    };

    const handleDragLeave = (e: Event) => {
        const dragEvent = e as DragEvent;
        if (container.contains(dragEvent.relatedTarget as Node)) return;
        container.classList.remove(config.dragOverClass || 'drag-over');
        if (globalDragState.targetContainer === container) {
            globalDragState.targetContainer = null;
        }
        if (globalDragState.placeholderElement && container.contains(globalDragState.placeholderElement)) {
            container.removeChild(globalDragState.placeholderElement);
        }
    };

    const handleDrop = (e: Event) => {
        const dragEvent = e as DragEvent;
        if (!globalDragState.isDragging || !globalDragState.targetContainer) return;
        dragEvent.preventDefault();

        const placeholder = globalDragState.placeholderElement!;
        if (!placeholder.parentElement) return;
        
        const newIndex = Array.from(placeholder.parentElement.children).indexOf(placeholder);

        const dragged = globalDragState.draggedItem!;
        const target = globalDragState.targetContainer;

        let itemToInsert = dragged;
        if (globalDragState.pullMode === 'clone') {
            itemToInsert = dragged.cloneNode(true) as HTMLElement;
            applyToElement(itemToInsert);
        }
        
        target.insertBefore(itemToInsert, placeholder);

        document.querySelectorAll('[data-sort-item][data-animate-flip]').forEach(item => {
            if ((item as any)._nexusAnimateFlip) {
                (item as any)._nexusAnimateFlip(globalDragState.initialRects);
            }
        });

        if (callbackExpression) {
            const rx = genRX();
            rx(globalDragState.draggedItemKey, newIndex);
        }

        cleanupDragState();
    };

    const updateGhostPosition = (e: DragEvent) => {
        if (!globalDragState.ghostElement) return;
        globalDragState.ghostElement.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    };

    const cleanupDragState = () => {
        if (globalDragState.draggedItem) {
            globalDragState.draggedItem.classList.remove(config.dragClass || 'is-dragging');
        }
        if (globalDragState.ghostElement) {
            globalDragState.ghostElement.remove();
        }
        if (globalDragState.placeholderElement && globalDragState.placeholderElement.parentElement) {
            globalDragState.placeholderElement.remove();
        }
        if (globalDragState.targetContainer) {
            globalDragState.targetContainer.classList.remove(config.dragOverClass || 'drag-over');
        }
        
        globalDragState.isDragging = false;
        globalDragState.draggedItem = null;
        globalDragState.draggedItemKey = null;
        globalDragState.sourceContainer = null;
        globalDragState.targetContainer = null;
        globalDragState.ghostElement = null;
        globalDragState.placeholderElement = null;
        globalDragState.group = null;
        globalDragState.initialRects.clear();
    };

    const getNewIndex = (e: DragEvent, targetContainer: HTMLElement) => {
        const items = Array.from(targetContainer.children).filter(
            child => child !== globalDragState.placeholderElement && child !== globalDragState.draggedItem && child.hasAttribute('data-sort-item')
        );
        
        if (items.length === 0) return { newIndex: 0 };

        const rects = items.map(el => el.getBoundingClientRect());
        const direction = config.direction || (targetContainer.offsetWidth > targetContainer.offsetHeight ? 'horizontal' : 'vertical');

        if (direction === 'vertical') {
            for (let i = 0; i < rects.length; i++) {
                if (e.clientY < rects[i].top + rects[i].height / 2) return { newIndex: i };
            }
        } else {
            for (let i = 0; i < rects.length; i++) {
                if (e.clientX < rects[i].left + rects[i].width / 2) return { newIndex: i };
            }
        }
        return { newIndex: items.length };
    };

    const attachListeners = () => {
        getDraggableItems().forEach(item => {
            item.setAttribute('draggable', 'true');
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('drag', handleDrag);
            item.addEventListener('dragend', handleDragEnd);
        });
        container.addEventListener('dragover', handleDragOver as EventListener);
        container.addEventListener('dragleave', handleDragLeave as EventListener);
        container.addEventListener('drop', handleDrop as EventListener);
    };

    const detachListeners = () => {
        getDraggableItems().forEach(item => {
            item.removeEventListener('dragstart', handleDragStart);
            item.removeEventListener('drag', handleDrag);
            item.removeEventListener('dragend', handleDragEnd);
        });
        container.removeEventListener('dragover', handleDragOver as EventListener);
        container.removeEventListener('dragleave', handleDragLeave as EventListener);
        container.removeEventListener('drop', handleDrop as EventListener);
    };

    attachListeners();

    const observer = new MutationObserver(() => {
        detachListeners();
        attachListeners();
    });
    observer.observe(container, { childList: true });

    return () => {
      detachListeners();
      observer.disconnect();
    };
  },
};
