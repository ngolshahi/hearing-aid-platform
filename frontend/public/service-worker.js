// service-worker.js
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// Cache static assets
workbox.routing.registerRoute(
  ({request}) => request.destination === 'image' ||
                 request.destination === 'style' ||
                 request.destination === 'script' ||
                 request.destination === 'font',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-assets',
  })
);

// Cache API requests
workbox.routing.registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Cache the 3D models
workbox.routing.registerRoute(
  ({request}) => request.url.includes('/models/'),
  new workbox.strategies.CacheFirst({
    cacheName: 'model-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// Cache the offline page
workbox.precaching.precacheAndRoute([
  { url: '/offline.html', revision: '1' }
]);

// Fallback to offline page if network request fails
workbox.routing.registerRoute(
  ({request}) => request.mode === 'navigate',
  async () => {
    try {
      return await workbox.strategies.NetworkFirst({
        cacheName: 'pages',
        plugins: [
          new workbox.expiration.ExpirationPlugin({
            maxEntries: 50,
          }),
        ],
      }).handle(event);
    } catch (error) {
      return caches.match('/offline.html');
    }
  }
);

self.addEventListener('fetch', (event) => {
  // Custom fetch behavior (if needed)
})
