import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: ['fishcake-wallet'],
    force: true, // Force re-optimization when dependencies change
  },
  build: {
    commonjsOptions: {
      include: [/fishcake-wallet/, /node_modules/],
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
