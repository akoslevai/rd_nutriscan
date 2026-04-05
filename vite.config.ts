import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'NutriScan',
        short_name: 'NutriScan',
        description: 'Scan food barcodes to check dietary conditions',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#16a34a',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'off-api-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/images\.openfoodfacts\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'off-images-cache', expiration: { maxEntries: 100 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': '/src' },
  },
})
