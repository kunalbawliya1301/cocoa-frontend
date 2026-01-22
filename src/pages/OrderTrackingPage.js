import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Clock, CheckCircle, Package, Truck } from 'lucide-react';
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
  const { token } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(response.data);
    } catch (error) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="order-loading">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-heading font-bold text-primary mb-4">Order not found</h2>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const statusInfo = statusConfig[order.status] || statusConfig.pending;

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-12" data-testid="order-tracking-page">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
          data-testid="back-to-dashboard-button"
        >
          ← Back to Orders
        </Button>

        <div className="bg-white rounded-3xl border border-border p-8 shadow-lg mb-8">
          <div className="text-center mb-8">
            <div className={`w-20 h-20 ${statusInfo.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <StatusIcon className={`w-10 h-10 ${statusInfo.color}`} />
            </div>
            <h1 className="text-2xl font-heading font-bold text-primary mb-2" data-testid="order-status">{statusInfo.label}</h1>
            <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {Object.entries(statusConfig).map(([key, config], idx) => {
              const isActive = key === order.status;
              const isPast = ['pending', 'preparing', 'ready', 'completed'].indexOf(key) <=
                ['pending', 'preparing', 'ready', 'completed'].indexOf(order.status);
              
              return (
                <div key={key} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isPast ? config.bg : 'bg-gray-100'
                    }`}
                  >
                    <config.icon className={`w-6 h-6 ${isPast ? config.color : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-xs text-center ${isPast ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {config.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="font-heading font-semibold text-primary mb-4">Order Details</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-foreground">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium text-primary">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4 flex justify-between items-center">
              <span className="font-heading font-semibold text-lg">Total</span>
              <span className="font-heading font-bold text-2xl text-primary" data-testid="order-total">${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};