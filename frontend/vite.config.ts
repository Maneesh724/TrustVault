import { defineConfig, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite configuration for TrustVault
// Proxies all /api/* calls to Django REST Framework backend on port 8000.
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ] as PluginOption[],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
