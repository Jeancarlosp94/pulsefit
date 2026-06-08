/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
   plugins: [
      react(),
      VitePWA({
         registerType: 'autoUpdate',
         injectRegister: 'auto',
         includeAssets: [
            'favicon.svg',
            'favicon.ico',
            'icons/apple-touch-icon.png',
            'icons/icon-64.png',
            'icons/icon-192.png',
            'icons/icon-512.png',
            'icons/icon-maskable-512.png'
         ],
         manifest: {
            name: 'PulseFit',
            short_name: 'PulseFit',
            description: 'Tu coach adaptativo de fitness y nutrición. Compasivo, flexible, gratuito.',
            lang: 'es',
            theme_color: '#6B8E5A',
            background_color: '#FAFAF7',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            categories: ['health', 'fitness', 'lifestyle'],
            icons: [
               {
                  src: '/icons/icon-64.png',
                  sizes: '64x64',
                  type: 'image/png',
                  purpose: 'any'
               },
               {
                  src: '/icons/icon-192.png',
                  sizes: '192x192',
                  type: 'image/png',
                  purpose: 'any'
               },
               {
                  src: '/icons/icon-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any'
               },
               {
                  src: '/icons/icon-maskable-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable'
               }
            ]
         },
         workbox: {
            globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/api/, /^\/auth/],
            runtimeCaching: [
               {
                  // Fonts: stable, cachear con expiración larga.
                  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                     cacheName: 'google-fonts-stylesheets',
                     expiration: {
                        maxEntries: 8,
                        maxAgeSeconds: 60 * 60 * 24 * 365
                     }
                  }
               },
               {
                  urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                     cacheName: 'google-fonts-webfonts',
                     expiration: {
                        maxEntries: 16,
                        maxAgeSeconds: 60 * 60 * 24 * 365
                     },
                     cacheableResponse: { statuses: [0, 200] }
                  }
               },
               {
                  // API Supabase: red primero, fallback al caché si offline.
                  urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                  handler: 'NetworkFirst',
                  options: {
                     cacheName: 'supabase-api',
                     networkTimeoutSeconds: 8,
                     expiration: {
                        maxEntries: 200,
                        maxAgeSeconds: 60 * 60 * 24
                     },
                     cacheableResponse: { statuses: [0, 200] }
                  }
               },
               {
                  // Imágenes externas (storage Supabase, Open Food Facts, etc.).
                  urlPattern: ({ request }) => request.destination === 'image',
                  handler: 'CacheFirst',
                  options: {
                     cacheName: 'images-cache',
                     expiration: {
                        maxEntries: 60,
                        maxAgeSeconds: 60 * 60 * 24 * 30
                     }
                  }
               }
            ]
         },
         devOptions: {
            enabled: false
         }
      })
   ],
   resolve: {
      alias: {
         '@': path.resolve(__dirname, './src')
      }
   },
   server: {
      port: 5173,
      host: true
   },
   build: {
      target: 'es2020',
      sourcemap: true
   },
   test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      include: ['src/**/*.{test,spec}.{ts,tsx}']
   }
})
