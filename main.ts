import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { setupPermission } from '@/utils/permission'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()

  app.use(pinia)
  setupPermission()

  return {
    app,
    Pinia: pinia
  }
}
