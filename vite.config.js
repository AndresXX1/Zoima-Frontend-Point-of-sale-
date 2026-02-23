import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    host: '0.0.0.0', // permite acceso desde fuera
    port: 5173,      // puerto de Vite
    strictPort: true // no cambia el puerto si está ocupado
  }
})