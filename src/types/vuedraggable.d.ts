declare module 'vuedraggable' {
  import { DefineComponent } from 'vue'
  
  interface DraggableComponentProps {
    list?: any[];
    modelValue?: any[];
    itemKey?: string;
    clone?: (original: any) => any;
    group?: string | { name: string; pull?: boolean | 'clone' | (() => string); put?: boolean | string[] | (() => string | string[]) };
    sort?: boolean;
    disabled?: boolean;
    ghostClass?: string;
    chosenClass?: string;
    dragClass?: string;
    handle?: string;
    animation?: number;
    move?: (evt: any, originalEvent: any) => boolean | void;
    componentData?: Record<string, any>;
  }

  const draggable: DefineComponent<DraggableComponentProps, {}, any>
  export default draggable
}
