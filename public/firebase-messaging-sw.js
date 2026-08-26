// Firebase Cloud Messaging Service Worker for background & closed-app notifications
// Barakamarkt24 Push Notification System

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
const firebaseConfig = {
  projectId: "gen-lang-client-0509797903",
  appId: "1:774602841270:web:42e3a18a2cf5ee120eda17",
  apiKey: "AIzaSyDKG_HTQ9gB9pdrdAB5BT2BpJTzZUKTWnY",
  authDomain: "gen-lang-client-0509797903.firebaseapp.com",
  messagingSenderId: "774602841270"
};

// Cache for recent notification IDs to prevent duplicate alerts
const recentNotifIds = new Set();

function showSafeNotification(title, options) {
  const dedupKey = `${title}_${options.tag || ''}_${options.body || ''}`;
  if (recentNotifIds.has(dedupKey)) {
    return Promise.resolve();
  }
  recentNotifIds.add(dedupKey);
  setTimeout(() => recentNotifIds.delete(dedupKey), 10000);

  return self.registration.showNotification(title, options);
}

try {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }

  const messaging = firebase.messaging();

  // Handle background messages received from Firebase Cloud Messaging
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'إشعار جديد من بركة ماركت 24';
    const tag = payload.data?.orderId ? `order-${payload.data.orderId}` : (payload.data?.tag || `baraka-${Date.now()}`);
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.message || payload.data?.body || '',
      icon: payload.notification?.icon || payload.data?.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: tag,
      renotify: true,
      vibrate: [200, 100, 200],
      dir: 'rtl',
      lang: 'ar',
      data: {
        url: payload.data?.url || '/',
        orderId: payload.data?.orderId || '',
        screen: payload.data?.screen || (payload.data?.role === 'admin' ? 'admin' : payload.data?.role === 'driver' ? 'driver' : 'orders'),
        type: payload.data?.type || 'order',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'open_order',
          title: 'عرض التفاصيل 🔍'
        },
        {
          action: 'dismiss',
          title: 'إغلاق ✕'
        }
      ]
    };

    return showSafeNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Firebase compat initialization notice:', e);
}

// Handle notification click to focus or open relevant screen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notificationData = event.notification.data || {};
  const targetScreen = notificationData.screen || 'home';
  const targetOrderId = notificationData.orderId || '';
  
  let targetUrl = '/';
  if (targetScreen === 'admin') {
    targetUrl = '/?screen=admin';
  } else if (targetScreen === 'driver') {
    targetUrl = '/?screen=driver';
  } else if (targetScreen === 'orders') {
    targetUrl = targetOrderId ? `/?screen=orders&orderId=${targetOrderId}` : '/?screen=orders';
  } else if (notificationData.url && notificationData.url !== '/') {
    targetUrl = notificationData.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if an existing tab is open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          // Send message to the client to switch screen dynamically without full reload
          client.postMessage({
            type: 'NOTIFICATION_NAVIGATE',
            screen: targetScreen,
            orderId: targetOrderId,
            url: targetUrl
          });
          return client.focus();
        }
      }
      // If no window is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Generic push event listener for standard web push payloads
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      if (data && (data.notification || data.data)) {
        const title = data.notification?.title || data.data?.title || 'بركة ماركت 24';
        const options = {
          body: data.notification?.body || data.data?.message || data.data?.body || '',
          icon: '/icons/icon-192x192.png',
          dir: 'rtl',
          lang: 'ar',
          vibrate: [200, 100, 200],
          data: data.data || {}
        };
        event.waitUntil(self.registration.showNotification(title, options));
      }
    } catch {
      // Handled by messaging.onBackgroundMessage
    }
  }
});

