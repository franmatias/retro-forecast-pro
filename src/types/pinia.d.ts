import 'pinia'

declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface DefineStoreOptionsBase<_, Store> {
    persist?: {
      key?: string
      storage?: Storage
      paths?: string[]
      beforeRestore?: (context: { store: Store }) => void
      afterRestore?: (context: { store: Store }) => void
      debug?: boolean
      serializer?: {
        serialize: <T>(value: T) => string
        deserialize: <T>(value: string) => T
      }
    } | boolean
  }
}
