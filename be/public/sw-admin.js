// Warung Edin Admin Service Worker — Web Push Notifications

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push event — show notification
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Warung Edin Admin',
    body: 'Ada notifikasi baru.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
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
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: true,
    tag: payload.data?.type === 'new_order'
      ? `order-${payload.data.order_id}`
      : 'admin-notif',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Notification click — open or focus the admin panel
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const adminUrl = self.location.origin + '/admin';
  const targetUrl = data.type === 'new_order'
    ? adminUrl + '/orders'
    : adminUrl;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(adminUrl) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
