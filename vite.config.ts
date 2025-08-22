// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/admin/', // 리소스 경로
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // ⬇️ 컨테이너에서 접근 가능하도록 외부 바인딩
    host: '0.0.0.0',
    port: 5173,

    // ⬇️ 게이트웨이→Vite 프록시 시 Host 헤더 허용
    allowedHosts: ['host.docker.internal', 'localhost', '127.0.0.1'],

    // ⬇️ HMR이 host.docker.internal을 사용하도록(개발 편의성)
    hmr: {
      host: 'host.docker.internal',
      port: 5173,
      protocol: 'ws',
    },

    proxy: {
      '/auth': { target: 'http://localhost:9001', changeOrigin: true },
      '/embed': { target: 'http://localhost:8000', changeOrigin: true, rewrite: p => p.replace(/^\/embed/, '') },
      '/scrape': { target: 'http://localhost:8420', changeOrigin: true, rewrite: p => p.replace(/^\/scrape/, '') },
      '/ops/embed': { target: 'http://localhost:8000', changeOrigin: true, rewrite: p => p.replace(/^\/ops\/embed/, '') },
      '/ops/scrape': { target: 'http://localhost:8420', changeOrigin: true, rewrite: p => p.replace(/^\/ops\/scrape/, '') },
    },
    // 필요 시 strictPort: true,
    // origin: 'http://host.docker.internal:5173', // 절대 URL이 필요한 경우만
  },
  build: { outDir: 'dist' },
})
