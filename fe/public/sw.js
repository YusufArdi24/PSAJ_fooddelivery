// Warung Edin Service Worker — Web Push Notifications

const CACHE_NAME = 'warungedin-v1';

// Install — skip waiting so the SW activates immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate — claim all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push event — show notification
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Warung Edin',
    body: 'Ada update baru untuk kamu!',
    icon: '/warungedin.png',
    badge: '/warungedin.png',
    data: {},
  };

  if (event.data) {
    try {
      const json = event.data.json();
      payload = { ...payload, ...json };
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/warungedin.png',
    badge: payload.badge || '/warungedin.png',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: false,
    tag: payload.data?.type === 'order_status'
      ? `order-${payload.data.order_id}`
      : 'warungedin-notif',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  if (data.type === 'order_status' && data.order_id) {
    url = `/orders`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (url !== '/') {
            client.navigate(url);
          }
          return;
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
