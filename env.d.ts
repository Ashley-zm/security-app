/// <reference types="@dcloudio/types" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module '@dcloudio/uni-h5-vue/dist/vue.runtime.esm.js' {
  export * from 'vue'
  export const injectHook: unknown
  export const isInSSRComponentSetup: boolean
}
