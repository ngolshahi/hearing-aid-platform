import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' 

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // This automatically registers the service worker
      registerType: 'autoUpdate',
      injectRegister: 'auto',  // Automatically inject service worker registration
      manifest: {
        name: 'Hearing Aid Platform',
        short_name: 'HearingAid',
        description: 'A platform to manage hearing aids and appointments',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
