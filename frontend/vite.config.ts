import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { trustvaultAuthApiPlugin } from './src/server/viteApiPlugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    trustvaultAuthApiPlugin(),
    tailwindcss(),
    react()
  ],
})
