import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Permite recargar /admin sin 404 en desarrollo
    historyApiFallback: true,
  },
})
