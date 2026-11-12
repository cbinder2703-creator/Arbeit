/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import { makeAuthConfig } from './src/auth/hash';

// Login (optional): nur wenn AZUBI_LOGIN_USER und AZUBI_LOGIN_PASS gesetzt sind. Im Code landet nur eine gesalzene Prüfsumme.
const loginUser = process.env.AZUBI_LOGIN_USER?.trim();
const loginPass = process.env.AZUBI_LOGIN_PASS;
const auth = loginUser && loginPass ? await makeAuthConfig(loginUser, loginPass) : null;

export default defineConfig({
  define: { __AUTH_CONFIG__: JSON.stringify(auth) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'AzubiQuest',
        short_name: 'AzubiQuest',
        description: 'Lernspiele für Berufsschüler – jede Prüfung ist ein eigenes Spiel.',
        lang: 'de',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B1020',
        theme_color: '#0B1020',
        categories: ['education'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // alles vorab laden → offline spielbar (Inhalte sind im JavaScript enthalten)
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { host: true },
  preview: { host: true },
  build: { chunkSizeWarningLimit: 700 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
