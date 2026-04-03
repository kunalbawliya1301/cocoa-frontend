/**
 * notifications.js
 *
 * WHY THIS EXISTS:
 *  - `new Notification()` from the main JS thread is NOT supported on
 *    mobile Chrome (Android) — it silently does nothing.
 *  - It is also unreliable in minimised/backgrounded desktop Chrome tabs.
 *  - `ServiceWorkerRegistration.showNotification()` works correctly in
 *    ALL of these cases and is the correct cross-platform API.
 *
 * This helper always prefers the SW path and falls back to the legacy
 * `new Notification()` only if no SW is registered.
 */

/**
 * Show a notification using the Service Worker (preferred) or the legacy
 * Notification API (fallback for environments without SW support).
 *
 * @param {string} title
 * @param {NotificationOptions & { url?: string }} options
 */
export async function showNotification(title, options = {}) {
  if (!('Notification' in window) && !('serviceWorker' in navigator)) return;
  if (Notification.permission !== 'granted') return;

  const { url, ...notifOptions } = options;
  const finalOptions = {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { url: url || '/dashboard' },
    ...notifOptions,
  };

  // ── Preferred path: Service Worker notification ──────────────────
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, finalOptions);
      return;
    } catch (err) {
      console.warn('[notifications] SW showNotification failed, falling back:', err);
    }
  }

  // ── Fallback: main-thread notification (desktop only) ────────────
  try {
    // eslint-disable-next-line no-new
    new Notification(title, finalOptions);
  } catch (err) {
    console.warn('[notifications] Notification fallback also failed:', err);
  }
}

/**
 * Request notification permission and register the Service Worker.
 * Call this once when the user logs in.
 */
export async function initNotifications() {
  // 1. Register (or re-use) the service worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (err) {
      console.warn('[notifications] SW registration failed:', err);
    }
  }

  // 2. Ask for permission (no-op if already granted/denied)
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (err) {
      console.warn('[notifications] Permission request failed:', err);
    }
  }
}
