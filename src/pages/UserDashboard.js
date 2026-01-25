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
      setOrders(res.data);
    } catch {
      if (!silent) toast.error('Failed to load orders');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;               // ⛔ wait for auth restore

    if (!user || !token) {
      navigate('/login');
      return;
    }

    fetchOrders();

    pollingRef.current = setInterval(() => {
      fetchOrders(true);
    }, 10000);

    return () => clearInterval(pollingRef.current);
  }, [user, token, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <Button onClick={() => navigate('/menu')}>Browse Menu</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => {
              const StatusIcon = statusConfig[order.status]?.icon || Clock;
              const statusInfo = statusConfig[order.status];

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-6 rounded-xl cursor-pointer"
                  onClick={() => navigate(`/order/${order.id}`)}
                >
                  <div className="flex justify-between">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 ${statusInfo.bg} flex items-center justify-center rounded-full`}>
                        <StatusIcon className={statusInfo.color} />
                      </div>
                      <div>
                        <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                        <p className={statusInfo.color}>{statusInfo.label}</p>
                      </div>
                    </div>
                    <p className="font-bold">₹{order.total_amount.toFixed(2)}</p>
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
