import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { apiClient } from '../lib/api';

export const OrderNotifier = () => {
  const { user } = useAuth();
  const pollingTimerRef = useRef(null);
  const recentNotificationsRef = useRef(new Map());
  const knownOrderStatusesRef = useRef(new Map());
  const initializedOrdersRef = useRef(false);
  const reviewUrl = (process.env.REACT_APP_GOOGLE_REVIEW_URL || '').trim();

  useEffect(() => {
    if (!user) return;
    knownOrderStatusesRef.current.clear();
    initializedOrdersRef.current = false;

    // Request notification permissions
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const notifyStatusChange = (orderId, status) => {
      const notificationKey = `${orderId}:${status}`;
      const now = Date.now();
      const previous = recentNotificationsRef.current.get(notificationKey);
      const isCompleted = status === 'completed';
      const shouldPromptForReview = isCompleted && Boolean(reviewUrl);

      // Prevent duplicate notifications from reconnect/retry bursts.
      if (previous && now - previous < 120000) {
        return;
      }
      recentNotificationsRef.current.set(notificationKey, now);

      const title = shouldPromptForReview
        ? `Order Complete: #${orderId.slice(0, 8)}`
        : `Order Update: #${orderId.slice(0, 8)}`;
      const message = shouldPromptForReview
        ? 'Your order is complete. Tap to leave a quick Google review.'
        : `Your order status is now: ${status.toUpperCase()}`;

      if (!document.hidden && !shouldPromptForReview) {
        toast.custom(
          () => (
            <div className="w-[320px] rounded-xl border border-amber-200 bg-white px-4 py-3 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Order update</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-sm text-slate-600">{message}</p>
            </div>
          ),
          { duration: 5000 }
        );
      } else if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: notificationKey,
          renotify: false,
        });

        if (shouldPromptForReview) {
          notification.onclick = () => {
            notification.close();
            window.focus();
            window.open(reviewUrl, '_blank', 'noopener,noreferrer');
          };
        }
      } else if (!document.hidden && shouldPromptForReview) {
        toast.custom(
          () => (
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
          ),
          { duration: 8000 }
        );
      }
    };

    const syncOrdersAndNotifyChanges = async (silentBootstrap = false) => {
      try {
        const res = await apiClient.get('/orders/my');
        const orders = Array.isArray(res.data) ? res.data : [];

        for (const order of orders) {
          const orderId = order.id;
          const nextStatus = order.status;
          const prevStatus = knownOrderStatusesRef.current.get(orderId);

          if (!initializedOrdersRef.current && silentBootstrap) {
            knownOrderStatusesRef.current.set(orderId, nextStatus);
            continue;
          }

          if (prevStatus && prevStatus !== nextStatus) {
            notifyStatusChange(orderId, nextStatus);
          }
          knownOrderStatusesRef.current.set(orderId, nextStatus);
        }

        initializedOrdersRef.current = true;
      } catch (error) {
        if (!silentBootstrap) {
          console.error('Order notifier fallback polling failed', error);
        }
      }
    };
    syncOrdersAndNotifyChanges(true);
    pollingTimerRef.current = setInterval(() => {
      syncOrdersAndNotifyChanges();
    }, 15000);

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [reviewUrl, user]);

  // This component doesn't render anything visible
  return null;
};
