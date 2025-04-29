declare module 'sortablejs' {
  interface SortableOptions {
    group?: string | {
      name?: string;
      pull?: boolean | 'clone' | Function;
      put?: boolean | string[] | Function;
    };
    sort?: boolean;
    delay?: number;
    delayOnTouchOnly?: boolean;
    touchStartThreshold?: number;
    disabled?: boolean;
    animation?: number;
    easing?: string;
    handle?: string;
    filter?: string;
    preventOnFilter?: boolean;
    draggable?: string;
    ghostClass?: string;
    chosenClass?: string;
    dragClass?: string;
    swapThreshold?: number;
    invertSwap?: boolean;
    invertedSwapThreshold?: number;
    direction?: 'vertical' | 'horizontal';
    forceFallback?: boolean;
    fallbackClass?: string;
    fallbackOnBody?: boolean;
    fallbackTolerance?: number;
    dragoverBubble?: boolean;
    removeCloneOnHide?: boolean;
    emptyInsertThreshold?: number;
    setData?: (dataTransfer: DataTransfer, dragEl: HTMLElement) => void;
    onChoose?: (evt: SortableEvent) => void;
    onUnchoose?: (evt: SortableEvent) => void;
    onStart?: (evt: SortableEvent) => void;
    onEnd?: (evt: SortableEvent) => void;
    onAdd?: (evt: SortableEvent) => void;
    onUpdate?: (evt: SortableEvent) => void;
    onSort?: (evt: SortableEvent) => void;
    onRemove?: (evt: SortableEvent) => void;
    onFilter?: (evt: SortableEvent) => void;
    onMove?: (evt: MoveEvent, originalEvent: Event) => boolean | void;
    onClone?: (evt: SortableEvent) => void;
    onChange?: (evt: SortableEvent) => void;
  }

  interface SortableEvent {
    oldIndex: number | undefined;
    newIndex: number | undefined;
    oldDraggableIndex: number | undefined;
    newDraggableIndex: number | undefined;
    item: HTMLElement;
    clone: HTMLElement;
    from: HTMLElement;
    to: HTMLElement;
    draggedRect: DOMRect;
    relatedRect: DOMRect;
    originalEvent: Event;
  }

  interface MoveEvent {
    dragged: HTMLElement;
    draggedRect: DOMRect;
    related: HTMLElement;
    relatedRect: DOMRect;
    willInsertAfter: boolean;
    originalEvent: Event;
  }

  class Sortable {
    static create(element: HTMLElement, options?: SortableOptions): Sortable;
    option<K extends keyof SortableOptions>(name: K, value?: SortableOptions[K]): SortableOptions[K];
    destroy(): void;
    toArray(): string[];
    sort(order: string[]): void;
    save(): void;
    closest(el: HTMLElement, selector: string): HTMLElement | null;
    clone(el: HTMLElement): HTMLElement;
  }

  export default Sortable;
}
