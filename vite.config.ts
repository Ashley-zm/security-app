import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('.', import.meta.url))
      },
      {
        find: /^vue$/,
        replacement: fileURLToPath(new URL('./utils/vue-app-plus-shim.ts', import.meta.url))
      }
    ]
  }
})
