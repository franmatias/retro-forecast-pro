import 'pinia'

declare module 'pinia' {
  export interface PiniaCustomProperties {
    persist?: boolean | {
      key?: string;
      storage?: Storage;
      paths?: string[];
    }
  }

  export interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean | {
      key?: string;
      storage?: Storage;
      paths?: string[];
    }
  }

  export interface PiniaPluginContext {
    options: {
      persist?: boolean | {
        key?: string;
        storage?: Storage;
        paths?: string[];
      }
    }
  }
}
