import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Clock, CheckCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../lib/api';

const statusConfig = {
  pending: { icon: Clock, label: 'Order Received', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  preparing: { icon: Package, label: 'Preparing', color: 'text-blue-600', bg: 'bg-blue-50' },
  ready: { icon: CheckCircle, label: 'Ready for Pickup', color: 'text-green-600', bg: 'bg-green-50' },
  completed: { icon: CheckCircle, label: 'Completed', color: 'text-green-600', bg: 'bg-green-50' },
};

const paymentMethodLabel = {
  online: 'Online',
  counter: 'Pay at Counter',
};

export const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const pollingRef = useRef(null);

  // ---------------- FETCH ORDER ----------------
  const fetchOrder = useCallback(async (silent = false) => {
    try {
      const res = await apiClient.get(`/orders/${orderId}`);
      setOrder(res.data);
    } catch (err) {
      if (!silent) toast.error('Failed to load order');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId]);

  // ---------------- AUTH GUARD + POLLING ----------------
  useEffect(() => {
    if (authLoading) return; // ⛔ wait for auth restore

    if (!user) {
      navigate('/login');
      return;
    }

    fetchOrder();

    let isActive = true;
    const pollOrder = async () => {
      if (!isActive) return;
      await fetchOrder(true); // silent polling
      if (isActive) {
        pollingRef.current = setTimeout(pollOrder, 5000);
      }
    };
    pollingRef.current = setTimeout(pollOrder, 5000);

    return () => {
      isActive = false;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [authLoading, fetchOrder, navigate, user]);

  // ---------------- LOADING ----------------
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ---------------- ORDER NOT FOUND ----------------
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const statusInfo = statusConfig[order.status] || statusConfig.pending;

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          ← Back to Orders
        </Button>

        <div className="bg-white rounded-3xl border p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className={`w-20 h-20 ${statusInfo.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <StatusIcon className={`w-10 h-10 ${statusInfo.color}`} />
            </div>
            <h1 className="text-2xl font-bold mb-2">{statusInfo.label}</h1>
            <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {Object.entries(statusConfig).map(([key, cfg]) => {
              const isPast =
                ['pending', 'preparing', 'ready', 'completed'].indexOf(key) <=
                ['pending', 'preparing', 'ready', 'completed'].indexOf(order.status);

              return (
                <div key={key} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${isPast ? cfg.bg : 'bg-gray-100'}`}>
                    <cfg.icon className={isPast ? cfg.color : 'text-gray-400'} />
                  </div>
                  <span className="text-xs text-center">{cfg.label.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Order Details</h3>
            <div className="mb-4 grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
              <p>Payment method: {paymentMethodLabel[order.payment_method] || 'Online'}</p>
              <p>Payment status: {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</p>
              {order.table_number && <p>Table: {order.table_number}</p>}
            </div>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between mb-2">
                <span>{item.quantity}x {item.name}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
