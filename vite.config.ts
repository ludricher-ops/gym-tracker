import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Le manifeste est servi depuis public/manifest.webmanifest.
      manifest: false,
      workbox: {
        // Précache aussi les polices woff2 → typo disponible hors-ligne.
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,webmanifest}'],
        navigateFallback: '/index.html',
        // Ne jamais servir la coquille SPA pour les routes API.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Les données vivent dans IndexedDB — l'API n'est jamais mise en cache.
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
