// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/admin/',                    // ★ 핵심: 리소스 경로를 /admin/ 아래로
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: '127.0.0.1',                // IPv4 고정 (게이트웨이와 일치)
    port: 5173,
    proxy: {
      // 5173을 직접 띄워 개발할 때만 사용; /admin 경유 시 게이트웨이가 프록시함
      '/auth': { target: 'http://localhost:9001', changeOrigin: true },
      '/embed': { target: 'http://localhost:8000', changeOrigin: true, rewrite: p => p.replace(/^\/embed/, '') },
      '/scrape': { target: 'http://localhost:8420', changeOrigin: true, rewrite: p => p.replace(/^\/scrape/, '') },
      '/ops/embed': { target: 'http://localhost:8000', changeOrigin: true, rewrite: p => p.replace(/^\/ops\/embed/, '') },
      '/ops/scrape': { target: 'http://localhost:8420', changeOrigin: true, rewrite: p => p.replace(/^\/ops\/scrape/, '') },
    },
  },
  build: { outDir: 'dist' },
})
