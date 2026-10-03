/* Hoïs service worker — Web Push only (no offline caching). */
/* sw-version: 2 — robust notificationclick (navigate awaited + caught) */

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
  const raw =
    (event.notification.data && event.notification.data.url) ||
    '/dashboard/notifications';
  // Resolve against the SW origin so query strings (e.g. ?n=<id>) survive.
  const target = new URL(raw, self.location.origin);

  event.waitUntil(
    (async function () {
      const list = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // 1) A tab is already on the destination → just focus it.
      for (const client of list) {
        try {
          if (new URL(client.url).pathname === target.pathname && 'focus' in client) {
            return client.focus();
          }
        } catch (e) {
          /* opaque/invalid client.url — skip */
        }
      }

      // 2) Reuse an open tab: navigate it, AWAITED + CAUGHT. navigate()
      //    rejects on an uncontrolled client, so on failure we fall through
      //    to openWindow instead of silently leaving the tab put.
      for (const client of list) {
        if ('navigate' in client && 'focus' in client) {
          try {
            const navigated = await client.navigate(target.href);
            await (navigated || client).focus();
            return;
          } catch (e) {
            /* uncontrolled client — try the next, else openWindow */
          }
        }
      }

      // 3) No usable tab → open a fresh window. Guarantees it always opens.
      if (self.clients.openWindow) {
        return self.clients.openWindow(target.href);
      }
    })()
  );
});
