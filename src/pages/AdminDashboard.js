import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminDashboard = () => {
  const { user, token, loading: authLoading } = useAuth(); // ✅ FIX
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const intervalRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    ingredients: '',
    calories: '',
    available: true,
  });

  // ---------------- AUTH GUARD ----------------
  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchData();

    intervalRef.current = setInterval(fetchOrdersOnly, 5000);
    return () => clearInterval(intervalRef.current);
  }, [user, authLoading]);

  // ---------------- FETCH ----------------
  const fetchData = async () => {
    try {
      const [menuRes, ordersRes] = await Promise.all([
        axios.get(`${API}/menu/items`),
        axios.get(`${API}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setMenuItems(menuRes.data);
      setOrders(ordersRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersOnly = async () => {
    try {
      const res = await axios.get(`${API}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch {
      console.error('Order polling failed');
    }
  };

  // ---------------- MENU CRUD ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        calories: parseInt(formData.calories),
        ingredients: formData.ingredients.split(',').map(i => i.trim()),
      };

      if (editingItem) {
        await axios.put(`${API}/menu/items/${editingItem.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Menu item updated');
      } else {
        await axios.post(`${API}/menu/items`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Menu item created');
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch {
      toast.error('Failed to save menu item');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(
        `${API}/admin/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Order status updated');
      fetchOrdersOnly();
    } catch {
      toast.error('Failed to update order status');
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
      ingredients: '',
      calories: '',
      available: true,
    });
  };

  // ---------------- LOADING ----------------
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>

        <Tabs defaultValue="orders">
          <TabsList className="mb-8">
            <TabsTrigger value="menu">Menu Items</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl">
                  <Package className="mx-auto mb-4" />
                  <p>No orders yet</p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-xl">
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="font-semibold">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm">{order.user_name}</p>
                      </div>
                      <p className="font-bold">
                        ₹{order.total_amount.toFixed(2)}
                      </p>
                    </div>

                    {order.items.map((item, i) => (
                      <p key={i} className="text-sm">
                        {item.quantity}x {item.name}
                      </p>
                    ))}

                    <Select
                      value={order.status}
                      onValueChange={(s) => updateOrderStatus(order.id, s)}
                    >
                      <SelectTrigger className="w-48 mt-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
