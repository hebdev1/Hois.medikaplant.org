/* Hoïs service worker — Web Push only (no offline caching). */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) =>
  event.waitUntil(self.clients.claim())
);

self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Hoïs', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Hoïs Inivèsite';
  const options = {
    body: data.body || '',
    icon: '/logo-hois.png',
    badge: '/logo-hois.png',
    data: { url: data.url || '/dashboard/notifications' },
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (list) {
        for (const client of list) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      })
  );
});
