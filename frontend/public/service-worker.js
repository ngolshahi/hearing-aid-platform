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
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
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
      new workbox.backgroundSync.BackgroundSyncPlugin('apiQueue', {
        maxRetentionTime: 24 * 60 // Retry for up to 24 Hours
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
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      }).handle(event);
    } catch (error) {
      return caches.match('/offline.html');
    }
  }
);

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/pwa-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Hearing Aid Platform', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/pwa-192x192.png',
        '/pwa-512x512.png'
      ]);
    })
  );
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'v1') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Custom fetch behavior (if needed)
})
