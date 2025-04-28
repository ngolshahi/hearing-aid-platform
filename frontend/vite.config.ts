import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' 
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mkcert(),
    VitePWA({
      // This automatically registers the service worker
      registerType: 'autoUpdate',
      injectRegister: 'auto',  // Automatically inject service worker registration
      manifest: {
        name: 'Hearing Aid Platform',
        short_name: 'HearingAid',
        description: 'Try on hearing aids in AR',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  define: {
    'process.env': {}
  },
  server: {
    https: {
      key: './localhost-key.pem',
      cert: './localhost.pem',
    },
    proxy: {
      '/api': {
        target: 'http://192.168.0.244:8080',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
