import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Clock, CheckCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusConfig = {
  pending: { icon: Clock, label: 'Order Received', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  preparing: { icon: Package, label: 'Preparing', color: 'text-blue-600', bg: 'bg-blue-50' },
  ready: { icon: CheckCircle, label: 'Ready for Pickup', color: 'text-green-600', bg: 'bg-green-50' },
  completed: { icon: CheckCircle, label: 'Completed', color: 'text-green-600', bg: 'bg-green-50' },
};

export const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { user, token, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const pollingRef = useRef(null);

  // ---------------- FETCH ORDER ----------------
  const fetchOrder = async (silent = false) => {
    try {
      const res = await axios.get(`${API}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data);
    } catch (err) {
      if (!silent) toast.error('Failed to load order');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ---------------- AUTH GUARD + POLLING ----------------
  useEffect(() => {
    if (authLoading) return; // ⛔ wait for auth restore

    if (!user || !token) {
      navigate('/login');
      return;
    }

    fetchOrder();

    pollingRef.current = setInterval(() => {
      fetchOrder(true); // silent polling
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [orderId, user, token, authLoading]);

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
