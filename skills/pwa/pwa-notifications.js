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