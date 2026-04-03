/**
 * OrderNotifier.js
 *
 * Listens for order-status changes and fires browser notifications + toasts.
 *
 * Strategy (dual-path):
 *  1. PRIMARY  — WebSocket receives instant "order_status_update" push from the
 *                server the moment admin changes a status.  Works even when the
 *                tab is minimised on desktop (WS stays alive).
 *  2. FALLBACK — Polling every 15 s catches anything the WS missed (reconnect
 *                windows, rate-limited events, etc.).
 *
 * Both paths use showNotification() (Service Worker) so notifications work on
 * mobile Chrome and in minimised desktop tabs.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { apiClient, ORDER_WS_URL } from '../lib/api';
import { showNotification, initNotifications } from '../lib/notifications';

export const OrderNotifier = () => {
  const { user, token } = useAuth();

  const pollingTimerRef        = useRef(null);
  const wsRef                  = useRef(null);
  const recentNotificationsRef = useRef(new Map());       // dedup guard
  const knownOrderStatusesRef  = useRef(new Map());       // orderId → status
  const initializedOrdersRef   = useRef(false);
  const reviewUrl = (process.env.REACT_APP_GOOGLE_REVIEW_URL || '').trim();

  /* ─────────────────────────────────────────────────────────────────────────
     NOTIFICATION HELPER
  ───────────────────────────────────────────────────────────────────────── */
  const fireNotification = (orderId, status, opts = {}) => {
    const notificationKey = `${orderId}:${status}`;
    const now = Date.now();
    const previous = recentNotificationsRef.current.get(notificationKey);

    // Prevent duplicate fires within 2 minutes (reconnect / polling overlap).
    if (previous && now - previous < 120_000) return;
    recentNotificationsRef.current.set(notificationKey, now);

    const isCompleted = status === 'completed';
    const shouldPromptForReview = isCompleted && Boolean(reviewUrl);

    const title = shouldPromptForReview
      ? `Order Complete: #${orderId.slice(0, 8)}`
      : `Order Update: #${orderId.slice(0, 8)}`;
    const message = shouldPromptForReview
      ? 'Your order is complete. Tap to leave a quick Google review.'
      : `Your order status is now: ${status.toUpperCase()}`;

    // SW notification — works on mobile AND minimised desktop Chrome.
    showNotification(title, {
      body: message,
      tag: notificationKey,
      renotify: false,
      url: shouldPromptForReview ? reviewUrl : '/dashboard',
    });

    // In-app toast when tab is visible.
    if (!document.hidden && !shouldPromptForReview) {
      toast.custom(() => (
        <div className="w-[320px] rounded-xl border border-amber-200 bg-white px-4 py-3 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Order update</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{message}</p>
        </div>
      ), { duration: 5000 });
    } else if (!document.hidden && shouldPromptForReview) {
      toast.custom(() => (
        <div className="w-[340px] rounded-xl border border-amber-200 bg-white px-4 py-3 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Order complete</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{message}</p>
          <button
            type="button"
            className="mt-3 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => window.open(reviewUrl, '_blank', 'noopener,noreferrer')}
          >
            Leave a review
          </button>
        </div>
      ), { duration: 8000 });
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
     POLLING FALLBACK  (catches anything the WS misses)
  ───────────────────────────────────────────────────────────────────────── */
  const syncOrders = async (silentBootstrap = false) => {
    try {
      const res = await apiClient.get('/orders/my');
      const orders = Array.isArray(res.data) ? res.data : [];

      for (const order of orders) {
        const { id: orderId, status: nextStatus } = order;
        const prevStatus = knownOrderStatusesRef.current.get(orderId);

        if (!initializedOrdersRef.current && silentBootstrap) {
          // First load — just snapshot current statuses, don't fire anything.
          knownOrderStatusesRef.current.set(orderId, nextStatus);
          continue;
        }

        if (prevStatus && prevStatus !== nextStatus) {
          fireNotification(orderId, nextStatus);
        }
        knownOrderStatusesRef.current.set(orderId, nextStatus);
      }

      initializedOrdersRef.current = true;
    } catch (err) {
      if (!silentBootstrap) console.error('OrderNotifier polling failed', err);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
     MAIN EFFECT — WebSocket (primary) + polling (fallback)
  ───────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!user || !token) return;

    // Register SW & request notification permission on login.
    initNotifications();

    // Snapshot current statuses so we don't spam on mount.
    knownOrderStatusesRef.current.clear();
    initializedOrdersRef.current = false;
    syncOrders(true);

    /* ── WebSocket (primary path) ──────────────────────────────────────── */
    let isActive = true;
    let reconnectDelay = 2000;
    let pingInterval = null;

    const connectWS = () => {
      if (!isActive) return;

      const ws = new WebSocket(`${ORDER_WS_URL}/${token}`);
      wsRef.current = ws;

      // Keepalive ping every 20 s — prevents server-side idle timeout.
      ws.onopen = () => {
        reconnectDelay = 2000;
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          if (typeof event.data !== 'string') return;
          const trimmed = event.data.trim();
          if (!trimmed || trimmed === 'pong' || !/^[{[]/.test(trimmed)) return;

          const data = JSON.parse(trimmed);

          // Server sends this when admin updates an order's status.
          if (data.type === 'order_status_update' && data.order_id && data.status) {
            const { order_id: orderId, status } = data;
            const prevStatus = knownOrderStatusesRef.current.get(orderId);

            if (prevStatus !== status) {
              knownOrderStatusesRef.current.set(orderId, status);
              fireNotification(orderId, status);
            }
          }
        } catch (err) {
          console.error('OrderNotifier WS parse error', err);
        }
      };

      ws.onerror = (err) => console.error('OrderNotifier WS error', err);

      ws.onclose = (event) => {
        clearInterval(pingInterval);
        pingInterval = null;
        wsRef.current = null;

        if (!isActive || event.code === 1000) return; // intentional close

        // Auto-reconnect with exponential backoff (2 s → 4 s → … → 30 s).
        console.warn(`OrderNotifier WS closed (${event.code}), reconnecting in ${reconnectDelay}ms`);
        setTimeout(() => { if (isActive) connectWS(); }, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      };
    };

    connectWS();

    /* ── Polling fallback (every 15 s) ────────────────────────────────── */
    let pollActive = true;
    const pollOrders = async () => {
      if (!pollActive) return;
      await syncOrders();
      if (pollActive) pollingTimerRef.current = setTimeout(pollOrders, 15000);
    };
    pollingTimerRef.current = setTimeout(pollOrders, 15000);

    return () => {
      isActive = false;
      pollActive = false;
      clearInterval(pingInterval);
      clearTimeout(pollingTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'OrderNotifier cleanup');
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  return null;
};
