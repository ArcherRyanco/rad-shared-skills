importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js');

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);

  // Precaching example (replace with your actual assets)
  workbox.precaching.precacheAndRoute([
    { url: '/index.html', revision: '1' },
    { url: '/css/style.css', revision: '1' },
    { url: '/js/main.js', revision: '1' },
    { url: '/images/logo.png', revision: '1' },
    // Add your manifest icons here as well
    { url: '/images/icons/icon-72x72.png', revision: '1' },
    { url: '/images/icons/icon-96x96.png', revision: '1' },
    { url: '/images/icons/icon-128x128.png', revision: '1' },
    { url: '/images/icons/icon-144x144.png', revision: '1' },
    { url: '/images/icons/icon-152x152.png', revision: '1' },
    { url: '/images/icons/icon-192x192.png', revision: '1' },
    { url: '/images/icons/icon-384x384.png', revision: '1' },
    { url: '/images/icons/icon-512x512.png', revision: '1' }
  ]);

  // Runtime caching strategies
  // Cache images with a Cache First strategy
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // Cache CSS and JS files with a Stale While Revalidate strategy
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'script' || request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // Example for API caching (Network First)
  // Adjust the regex to match your API endpoints
  workbox.routing.registerRoute(
    new RegExp('^https://api\\.example\\.com/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        }),
      ],
    })
  );

  // Push Notification Listener (requires `pwa-notifications.js` registration)
  self.addEventListener('push', (event) => {
    const data = event.data.json();
    console.log('Push received:', data);
    const title = data.title || 'PWA Notification';
    const options = {
      body: data.body || 'You have a new message!',
      icon: data.icon || '/images/icons/icon-192x192.png',
      badge: data.badge || '/images/icons/icon-72x72.png',
      data: {
        url: data.url || '/',
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  });

} else {
  console.log(`Boo! Workbox didn't load 😬`);
}