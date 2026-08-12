import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'EloriaHaven',
        short_name: 'EloriaHaven',
        description: 'A mental wellness companion for Indian college students',
        theme_color: '#7c6fff',
        background_color: '#f2f0ff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Force any waiting service worker to activate immediately, and take
        // control of open tabs right away — without this, a person who had
        // the app open during a previous deploy can get stuck on an old
        // cached build (referencing JS/CSS filenames that no longer exist)
        // until they manually close every tab, which shows up as a white
        // screen with no obvious cause.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Cache the app shell; API calls to your backend are left alone
        // (network-only) so mood check-ins, journal entries, and chat
        // never silently serve stale cached data.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/eloriahaven\.onrender\.com\/.*/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})