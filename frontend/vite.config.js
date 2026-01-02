import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Esto solo aplica para desarrollo local (npm run dev)
        target: 'http://localhost:10000', // Asegúrate que coincida con el puerto de tu server local
        changeOrigin: true,
      }
    }
  }
})
