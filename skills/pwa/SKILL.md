# PWA Setup Skill

This skill provides a comprehensive setup for Progressive Web Applications (PWAs), including manifest generation, service worker for offline caching, install prompt handling, push notifications, and Workbox integration.

## Usage

To use this skill, integrate the provided templates into your web project.

### 1. Web App Manifest (manifest.json)

The `manifest.json` file describes your PWA to the browser. It includes information like app name, icons, start URL, display mode, etc.

**Template: `manifest.json`**

```json
{
  "name": "My PWA App",
  "short_name": "MyPWA",
  "description": "A progressive web application.",
  "start_url": "/index.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/images/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/images/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/images/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/images/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/images/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/images/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/images/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/images/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Integration:** Link this manifest in your `index.html` (or main HTML file):

```html
<link rel="manifest" href="/manifest.json">
```

### 2. Service Worker for Offline Caching (service-worker.js)

A service worker enables offline capabilities and advanced caching strategies using Workbox.

**Template: `service-worker.js`**

```javascript
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
```

**Integration (in your main JavaScript file, e.g., `main.js`):**

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered! Scope:', registration.scope);
      })
      .catch(err => {
        console.log('Service Worker registration failed:', err);
      });
  });
}
```

### 3. Install Prompts and `beforeinstallprompt` Handling (pwa-install.js)

This script manages the "Add to Home Screen" prompt, allowing you to provide a custom install experience.

**Template: `pwa-install.js`**

```javascript
let deferredPrompt;
const installButton = document.getElementById('install-pwa-button'); // Your custom install button

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI notify the user they can install the PWA
  if (installButton) {
    installButton.style.display = 'block';
  }
  console.log('beforeinstallprompt event fired.');
});

if (installButton) {
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      // Optionally, send analytics event with outcome of user choice
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and can't use it again, clear it.
      deferredPrompt = null;
      // Hide the install button if it was shown
      installButton.style.display = 'none';
    }
  });
}

window.addEventListener('appinstalled', () => {
  // Log install to analytics
  console.log('PWA was installed!');
  // Hide the install button if it was shown
  if (installButton) {
    installButton.style.display = 'none';
  }
});
```

**Integration:** Include this script in your `index.html` (or main HTML file) after your main JavaScript, and ensure you have an element with `id="install-pwa-button"` if you want a custom button.

```html
<button id="install-pwa-button" style="display: none;">Install App</button>
<script src="/js/pwa-install.js"></script>
```

### 4. Push Notification Setup (web-push) (pwa-notifications.js)

This script handles registering for push notifications and subscribing/unsubscribing users. It assumes you have a backend endpoint to generate VAPID keys and handle subscriptions.

**Template: `pwa-notifications.js`**

```javascript
const applicationServerKey = 'YOUR_PUBLIC_VAPID_KEY'; // Replace with your actual public VAPID key
const subscribeButton = document.getElementById('subscribe-pwa-button'); // Your custom subscribe button

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeUser() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported.');
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const currentSubscription = await registration.pushManager.getSubscription();

  if (currentSubscription) {
    console.log('Already subscribed:', currentSubscription);
    // You might want to update UI to show 'Unsubscribe'
    if (subscribeButton) subscribeButton.textContent = 'Unsubscribe from Push';
    return;
  }

  try {
    const applicationServerKeyArray = urlB64ToUint8Array(applicationServerKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKeyArray,
    });

    console.log('User is subscribed:', subscription);
    // Send subscription to your backend server
    await fetch('/api/subscribe', { // Replace with your backend endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
    console.log('Subscription sent to server.');
    if (subscribeButton) subscribeButton.textContent = 'Unsubscribe from Push';

  } catch (err) {
    console.error('Failed to subscribe the user:', err);
    if (Notification.permission === 'denied') {
      console.warn('Notifications are blocked.');
    }
  }
}

async function unsubscribeUser() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
    console.log('User is unsubscribed.');
    // Inform your backend server to remove the subscription
    await fetch('/api/unsubscribe', { // Replace with your backend endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    console.log('Unsubscription sent to server.');
    if (subscribeButton) subscribeButton.textContent = 'Subscribe to Push';
  }
}

if (subscribeButton) {
  subscribeButton.addEventListener('click', async () => {
    if (subscribeButton.textContent === 'Subscribe to Push') {
      await subscribeUser();
    } else {
      await unsubscribeUser();
    }
  });
}

// Check initial subscription status when page loads
window.addEventListener('load', async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscribeButton) {
      if (subscription) {
        subscribeButton.textContent = 'Unsubscribe from Push';
      } else {
        subscribeButton.textContent = 'Subscribe to Push';
      }
      subscribeButton.style.display = 'block';
    }
  }
});

// Request notification permission if not granted
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        // Optionally subscribe user after permission is granted
        // subscribeUser();
      } else {
        console.warn('Notification permission denied.');
      }
    });
  }
}

// Call this function when appropriate, e.g., on a user gesture
// requestNotificationPermission();
```

**Integration:** Include this script in your `index.html` (or main HTML file) and provide a button with `id="subscribe-pwa-button"`. Remember to replace `YOUR_PUBLIC_VAPID_KEY` and the backend API endpoints.

```html
<button id="subscribe-pwa-button" style="display: none;">Subscribe to Push</button>
<script src="/js/pwa-notifications.js"></script>
```

### 5. Workbox Integration

Workbox is already integrated into the `service-worker.js` template. You can customize caching strategies by:

-   **Precaching:** Add assets to `workbox.precaching.precacheAndRoute([])` for immediate caching.
-   **Runtime Caching:** Use `workbox.routing.registerRoute()` with different strategies like `CacheFirst`, `StaleWhileRevalidate`, `NetworkFirst`, or `NetworkOnly` based on your needs.
    -   `CacheFirst`: For assets that change infrequently (e.g., images, fonts).
    -   `StaleWhileRevalidate`: For assets that can be served quickly from cache but should be updated in the background (e.g., CSS, JS).
    -   `NetworkFirst`: For content that needs to be fresh but can fall back to cache offline (e.g., API calls, HTML pages).

---

This skill provides the foundational files and code snippets to quickly set up a PWA with essential features. Remember to adapt paths, names, and API endpoints to your specific project.
