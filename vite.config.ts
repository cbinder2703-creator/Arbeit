import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' damit der Build auch unter file:// (Electron) und in Capacitor läuft
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true },
})
