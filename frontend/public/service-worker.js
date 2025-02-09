// service-worker.js
import { precacheAndRoute } from 'workbox-precaching'

// This will automatically cache the assets built by Vite
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('fetch', (event) => {
  // Custom fetch behavior (if needed)
})
