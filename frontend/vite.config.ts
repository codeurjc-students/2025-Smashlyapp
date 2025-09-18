import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Permite conexiones externas
    open: true, // Abre automáticamente en el navegador
    strictPort: false, // Si el puerto 3000 está ocupado, usa el siguiente disponible
  },
  build: {
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})