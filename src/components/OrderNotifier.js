import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const WS_URL = BACKEND_URL.replace(/^http/, 'ws') + '/api/ws/orders';

export const OrderNotifier = () => {
  const { user, token } = useAuth();
  const wsRef = useRef(null);
  const pingTimerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const recentNotificationsRef = useRef(new Map());

  useEffect(() => {
    // Only connect if the user is authenticated
    if (!user || !token) return;

    // Request notification permissions
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const connectWebSocket = () => {
      // Create WebSocket connection
      wsRef.current = new WebSocket(`${WS_URL}/${token}`);

      wsRef.current.onopen = () => {
        console.log('WebSocket Connected for Order Notifications');
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        pingTimerRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send('ping');
          }
        }, 25000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'order_status_update') {
            const notificationKey = `${data.order_id}:${data.status}`;
            const now = Date.now();
            const previous = recentNotificationsRef.current.get(notificationKey);

            // Prevent duplicate notifications from reconnect/retry bursts.
            if (previous && now - previous < 8000) {
              return;
            }
            recentNotificationsRef.current.set(notificationKey, now);

            const title = `Order Update: #${data.order_id.slice(0, 8)}`;
            const message = `Your order status is now: ${data.status.toUpperCase()}`;

            // If tab is visible, use custom in-app toast.
            if (!document.hidden) {
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
              // If tab is in background, use native notification only.
              new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                tag: notificationKey,
                renotify: false,
              });
            }
          }
          if (data.type === 'ws_connected') {
            console.log('Order notifier socket handshake complete');
          }
        } catch (err) {
          if (event.data !== 'pong') {
            console.error('Error processing WebSocket message:', err);
          }
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket Disconnected', event);
        if (pingTimerRef.current) {
          clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }
        // Attempt to reconnect after a delay if not cleanly closed
        if (event.code !== 1000) {
           reconnectTimerRef.current = setTimeout(connectWebSocket, 5000);
        }
      };
    };

    connectWebSocket();

    // Cleanup on unmount or when token changes
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
      }
      if (wsRef.current) {
        // Normal closure code
        wsRef.current.close(1000, "Disconnecting"); 
      }
    };
  }, [user, token]);

  // This component doesn't render anything visible
  return null;
};
