/* =============================================================
   CoCoa Cafe — Service Worker
   Purpose: Enable reliable notifications on mobile Chrome and
   minimized desktop Chrome tabs.  new Notification() from the
   main thread is NOT supported on mobile and is unreliable when
   the tab is backgrounded; ServiceWorkerRegistration.showNotification()
   works in both cases.
   ============================================================= */

/* ── Notification click handler ──────────────────────────────
   When the user taps a notification it focuses/opens the app.  */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window/tab is already open, focus it
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            return;
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

/* ── Keep the SW alive; respond to pings from the page ──── */
self.addEventListener('message', (event) => {
  if (event.data === 'ping') {
    event.ports?.[0]?.postMessage('pong');
  }
});
