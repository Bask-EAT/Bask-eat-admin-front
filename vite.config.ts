import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // 기존 API (8000)
      '/search': 'http://localhost:8000',
      '/index': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },

      // ✅ OPS 패널 백엔드 (8420)
      // 프론트에서 /ops/save_categories 같은 식으로 호출하면
      // -> http://localhost:8420/save_categories 로 전달됩니다.
      '/ops': {
        target: 'http://localhost:8420',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ops/, ''),
      },
    },
  },
  build: { outDir: 'dist' },
})
