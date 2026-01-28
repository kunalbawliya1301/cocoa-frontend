import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Clock, Package, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  preparing: { icon: Package, label: 'Preparing', color: 'text-blue-600', bg: 'bg-blue-50' },
  ready: { icon: CheckCircle, label: 'Ready', color: 'text-green-600', bg: 'bg-green-50' },
  completed: { icon: CheckCircle, label: 'Completed', color: 'text-green-600', bg: 'bg-green-50' },
};

/* ---------------- DATE + TIME (IST SAFE) ---------------- */
const formatDateTime = (order) => {
  const raw =
    order.createdAt ||
    order.created_at ||
    order.date ||
    order.orderDate;

  if (!raw) return 'Date unavailable';

  let date;

  if (typeof raw === 'string' && !raw.includes('Z')) {
    date = new Date(raw + 'Z');
  } else {
    date = new Date(raw);
  }

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};
/* ------------------------------------------------------- */

export const UserDashboard = () => {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef(null);

  const fetchOrders = async (silent = false) => {
    try {
      const res = await axios.get(`${API}/orders/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data || []);
    } catch {
      if (!silent) toast.error('Failed to load orders');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user || !token) {
      navigate('/login');
      return;
    }

    fetchOrders();

    pollingRef.current = setInterval(() => {
      fetchOrders(true);
    }, 10000);

    return () => clearInterval(pollingRef.current);
  }, [user, token, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <Button onClick={() => navigate('/menu')}>Browse Menu</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => {
              const statusInfo =
                statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = statusInfo.icon;

              /* -------- ITEM SUMMARY (Swiggy-style) -------- */
              const itemsText =
                order.items && order.items.length > 0
                  ? order.items.length <= 2
                    ? order.items
                        .map(i => `${i.name} ×${i.quantity}`)
                        .join(', ')
                    : `${order.items[0].name} ×${order.items[0].quantity}, ${
                        order.items[1].name
                      } ×${order.items[1].quantity} +${
                        order.items.length - 2
                      } more`
                  : 'Items not available';
              /* --------------------------------------------- */

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-4 sm:p-6 rounded-xl cursor-pointer hover:shadow-md transition"
                  onClick={() => navigate(`/order/${order.id}`)}
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    
                    {/* LEFT */}
                    <div className="flex gap-3 items-start">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 ${statusInfo.bg} flex items-center justify-center rounded-full shrink-0`}
                      >
                        <StatusIcon className={statusInfo.color} size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base line-clamp-2">
                          {itemsText}
                        </p>

                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                          {formatDateTime(order)}
                        </p>

                        <p className={`text-xs sm:text-sm mt-0.5 ${statusInfo.color}`}>
                          {statusInfo.label}
                        </p>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="text-right sm:text-left">
                      <p className="font-semibold text-sm sm:text-lg">
                        ₹{Number(order.total_amount || 0).toFixed(2)}
                      </p>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
