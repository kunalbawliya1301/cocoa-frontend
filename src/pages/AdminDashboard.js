import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { Plus, Pencil, Trash2, Package, QrCode, TrendingUp, ShoppingCart, IndianRupee, Clock, CalendarDays, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { apiClient, ORDER_WS_URL } from "../lib/api";
import { showNotification, initNotifications } from "../lib/notifications";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* ── Date formatter ──────────────────────────────── */
const formatDateTime = (order) => {
  const raw = order.createdAt || order.created_at || order.date;
  if (!raw) return "Date unavailable";
  const normalizedRaw =
    typeof raw === "string" && !/[zZ]|[+-]\d{2}:\d{2}$/.test(raw)
      ? `${raw}Z`
      : raw;
  const date = new Date(normalizedRaw);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

/* ── Analytics helpers ───────────────────────────── */
const PIE_COLORS = ["#4A3728", "#C05621", "#D4C5B0", "#8B5A2B", "#6B4F3F", "#A0522D"];
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const paymentMethodLabel = {
  online: "Online",
  counter: "Pay at Counter",
};

const paymentStatusStyles = {
  paid: "bg-green-50 text-green-700 border-green-200",
  unpaid: "bg-amber-50 text-amber-700 border-amber-200",
};

const buildAnalytics = (orders, menuItems = []) => {
  const now = new Date();
  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "preparing").length;

  // Last 7 days bar chart
  const dayMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
    dayMap[key] = 0;
  }
  orders.forEach((o) => {
    const raw = o.created_at || o.createdAt;
    if (!raw) return;
    const date = typeof raw === "string" && !raw.includes("Z") ? new Date(raw + "Z") : new Date(raw);
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays <= 6) {
      const key = date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
      if (key in dayMap) dayMap[key] = (dayMap[key] || 0) + (o.total_amount || 0);
    }
  });
  const dailyRevenue = Object.entries(dayMap).map(([day, revenue]) => ({ day, revenue: parseFloat(revenue.toFixed(2)) }));

  // Revenue by category — look up category from menuItems since OrderItems don't store it
  const nameToCategory = {};
  menuItems.forEach((m) => { nameToCategory[m.name] = m.category; });
  const catMap = {};
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const cat = nameToCategory[item.name] || item.category || "Other";
      catMap[cat] = (catMap[cat] || 0) + item.price * item.quantity;
    });
  });
  const categoryRevenue = Object.entries(catMap).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

  // Top items
  const itemMap = {};
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      if (!itemMap[item.name]) itemMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
      itemMap[item.name].qty += item.quantity;
      itemMap[item.name].revenue += item.price * item.quantity;
    });
  });
  const topItems = Object.values(itemMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return { totalRevenue, totalOrders, avgOrderValue, pendingOrders, dailyRevenue, categoryRevenue, topItems };
};

/* ── KPI Card ────────────────────────────────────── */
const KpiCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-border/40">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-xl font-bold text-primary">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  </div>
);

/* ── Analytics Tab ───────────────────────────────── */
const AnalyticsTab = ({ orders, menuItems, analytics }) => {
  const { totalRevenue, totalOrders, avgOrderValue, pendingOrders, dailyRevenue, categoryRevenue, topItems } =
    buildAnalytics(orders, menuItems);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <KpiCard icon={CalendarDays} label="Today's Revenue" value={currency.format(analytics.today_revenue || 0)} color="bg-primary" />
        <KpiCard icon={TrendingUp} label="Weekly Revenue" value={currency.format(analytics.week_revenue || 0)} color="bg-green-600" />
        <KpiCard icon={WalletCards} label="Monthly Revenue" value={currency.format(analytics.month_revenue || 0)} color="bg-amber-600" />
        <KpiCard icon={ShoppingCart} label="Total Orders" value={analytics.total_orders || 0} color="bg-accent" />
        <KpiCard icon={IndianRupee} label="Total Revenue" value={currency.format(analytics.total_revenue || 0)} color="bg-slate-700" />
        <KpiCard icon={Clock} label="Active Orders" value={pendingOrders} sub="pending + preparing" color="bg-yellow-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart — last 7 days */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-border/40">
          <h3 className="font-semibold text-primary mb-4">Revenue — Last 7 Days</h3>
          {dailyRevenue.every((d) => d.revenue === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">No revenue data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyRevenue} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => [`₹${v}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#4A3728" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart — by category (fallback: show message) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/40">
          <h3 className="font-semibold text-primary mb-4">Revenue by Category</h3>
          {categoryRevenue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No category data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryRevenue}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryRevenue.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`₹${v}`, "Revenue"]} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Items Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/40">
        <h3 className="font-semibold text-primary mb-4">🏆 Top Selling Items</h3>
        {topItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground text-xs uppercase">
                  <th className="text-left pb-2">Item</th>
                  <th className="text-right pb-2">Qty Sold</th>
                  <th className="text-right pb-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item, i) => (
                  <tr key={item.name} className="border-b border-border/20 last:border-0">
                    <td className="py-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">#{i + 1}</span>
                      {item.name}
                    </td>
                    <td className="py-2 text-right font-medium">{item.qty}</td>
                    <td className="py-2 text-right font-semibold text-primary">₹{item.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────── */
export const AdminDashboard = () => {
  const { user, token, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const knownOrderIdsRef = useRef(new Set());

  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({
    today_revenue: 0,
    week_revenue: 0,
    month_revenue: 0,
    total_orders: 0,
    total_revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [orderFilters, setOrderFilters] = useState({
    startDate: "",
    endDate: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    ingredients: "",
    calories: "",
    available: true,
    tags: [],
  });

  const getOrderFilterParams = useCallback(() => {
    const params = {};
    if (orderFilters.startDate) {
      params.start_date = orderFilters.startDate;
    }
    if (orderFilters.endDate) {
      params.end_date = orderFilters.endDate;
    }
    return params;
  }, [orderFilters.endDate, orderFilters.startDate]);

  /* ── Auth ─────────────────────────────── */
  const handleUnauthorized = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    logout();
    toast.error("Admin session expired. Please login again.");
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  /* ── Notification sound ───────────────── */
  // Defined here (before fetchOrdersOnly) to avoid a Temporal Dead Zone error.
  const playNotificationSound = useCallback(() => {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    const context = audioContextRef.current;
    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const now = context.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(1174, now + 0.18);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.45);
  }, []);

  // Keep a stable ref so fetchOrdersOnly can call it without a dep-array entry
  const playNotificationSoundRef = useRef(playNotificationSound);
  useEffect(() => { playNotificationSoundRef.current = playNotificationSound; }, [playNotificationSound]);

  /* ── Fetch ────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      const [menuRes, orderRes, analyticsRes] = await Promise.all([
        apiClient.get("/menu/items"),
        apiClient.get("/admin/orders", { params: getOrderFilterParams() }),
        apiClient.get("/admin/analytics"),
      ]);
      setMenuItems(menuRes.data);
      setOrders(orderRes.data);
      setAnalytics(analyticsRes.data);
      knownOrderIdsRef.current = new Set((orderRes.data || []).map((order) => order.id));
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [getOrderFilterParams, handleUnauthorized]);

  const fetchOrdersOnly = useCallback(async () => {
    try {
      const [ordersRes, analyticsRes] = await Promise.all([
        apiClient.get("/admin/orders", { params: getOrderFilterParams() }),
        apiClient.get("/admin/analytics"),
      ]);

      const freshOrders = ordersRes.data || [];

      // ── Detect brand-new orders that the WS may have missed ──────────
      // (happens during a WS reconnect window)
      const prevKnown = knownOrderIdsRef.current;
      const newOrders = freshOrders.filter((o) => !prevKnown.has(o.id));

      if (newOrders.length > 0) {
        newOrders.forEach((order) => {
          playNotificationSoundRef.current();
          toast.success(`New order from ${order.user_name}`, {
            description: `Order #${order.id.slice(0, 8)} for Rs ${Number(order.total_amount || 0).toFixed(2)}`,
          });
          showNotification("New order received", {
            body: `${order.user_name} placed order #${order.id.slice(0, 8)} for Rs ${Number(order.total_amount || 0).toFixed(2)}`,
            tag: `admin-order-${order.id}`,
            renotify: true,
            url: "/admin",
          });
        });
      }

      setOrders(freshOrders);
      setAnalytics(analyticsRes.data);
      knownOrderIdsRef.current = new Set(freshOrders.map((order) => order.id));
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.error("Order polling failed");
    }
  }, [getOrderFilterParams, handleUnauthorized]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
    
    let isActive = true;
    const pollOrdersOnly = async () => {
      if (!isActive) return;
      await fetchOrdersOnly();
      if (isActive) {
        intervalRef.current = setTimeout(pollOrdersOnly, 5000);
      }
    };
    intervalRef.current = setTimeout(pollOrdersOnly, 5000);

    return () => {
      isActive = false;
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [authLoading, fetchData, fetchOrdersOnly, handleUnauthorized, navigate, user]);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      return;
    }

    // Register SW + request notification permission.
    // This is the ONLY way that works on mobile Chrome and minimised desktop tabs.
    initNotifications();
  }, [user]);


  useEffect(() => {
    if (authLoading || !user || user.role !== "admin" || !token) {
      return undefined;
    }

    let isActive = true;
    let reconnectDelay = 2000; // start at 2s, doubles on each failure (max 30s)
    let pingInterval = null;

    const connectWS = () => {
      if (!isActive) return;

      const ws = new WebSocket(`${ORDER_WS_URL}/${token}`);
      wsRef.current = ws;

      // ── Keepalive: ping every 20s so the server never times us out ──
      ws.onopen = () => {
        reconnectDelay = 2000; // reset backoff on successful connect
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          if (typeof event.data !== "string") return;
          const trimmed = event.data.trim();
          if (!trimmed || trimmed === "pong" || !/^[{\[]/.test(trimmed)) return;

          const data = JSON.parse(trimmed);
          if (data.type !== "new_order" || !data.order) return;
          if (knownOrderIdsRef.current.has(data.order.id)) return;

          knownOrderIdsRef.current.add(data.order.id);
          setOrders((currentOrders) => [data.order, ...currentOrders]);
          playNotificationSound();
          toast.success(`New order from ${data.order.user_name}`, {
            description: `Order #${data.order.id.slice(0, 8)} for Rs ${Number(data.order.total_amount || 0).toFixed(2)}`,
          });

          // SW notification — works on minimised desktop tabs
          showNotification("New order received", {
            body: `${data.order.user_name} placed order #${data.order.id.slice(0, 8)} for Rs ${Number(data.order.total_amount || 0).toFixed(2)}`,
            tag: `admin-order-${data.order.id}`,
            renotify: true,
            url: "/admin",
          });
        } catch (error) {
          console.error("Failed to process admin order event", error, event.data);
        }
      };

      ws.onerror = (error) => {
        console.error("Admin order WebSocket error", error);
      };

      // ── Auto-reconnect on unexpected close ───────────────────────────
      ws.onclose = (event) => {
        clearInterval(pingInterval);
        pingInterval = null;
        wsRef.current = null;

        // code 1000 = intentional close (cleanup); don't reconnect
        if (!isActive || event.code === 1000) return;

        console.warn(`Admin WS closed (code=${event.code}), reconnecting in ${reconnectDelay}ms`);
        setTimeout(() => {
          if (isActive) connectWS();
        }, reconnectDelay);

        // Exponential backoff: 2s → 4s → 8s → … capped at 30s
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      };
    };

    connectWS();

    return () => {
      isActive = false;
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close(1000, "Admin dashboard cleanup");
        wsRef.current = null;
      }
    };
  }, [authLoading, playNotificationSound, token, user]);

  /* ── Menu CRUD ────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: Number(formData.price),
      calories: Number(formData.calories),
      ingredients: formData.ingredients.split(",").map((i) => i.trim()),
    };
    try {
      if (editingItem) {
        await apiClient.put(`/menu/items/${editingItem.id}`, payload);
        toast.success("Menu item updated");
      } else {
        await apiClient.post("/menu/items", payload);
        toast.success("Menu item added");
      }
      resetForm();
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to save menu item");
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/menu/items/${id}`);
      toast.success("Item deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const toggleMenuAvailability = async (itemId, available) => {
    try {
      await apiClient.patch(`/admin/menu/${itemId}/availability`, { available });
      setMenuItems((currentItems) =>
        currentItems.map((item) => (item.id === itemId ? { ...item, available } : item)),
      );
      toast.success(available ? "Item marked available" : "Item marked out of stock");
    } catch {
      toast.error("Failed to update availability");
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      imageType: "url",
      imageFile: null,
      image_url: "",
      ingredients: "",
      calories: "",
      available: true,
      tags: [],
    });
  };

  /* ── Order Status ─────────────────────── */
  const updateOrderStatus = async (orderId, status) => {
    try {
      await apiClient.put(`/admin/orders/${orderId}/status`, { status });
      toast.success("Order status updated");
      fetchOrdersOnly();
    } catch {
      toast.error("Failed to update order");
    }
  };

  const updatePaymentStatus = async (orderId, paymentStatus) => {
    try {
      await apiClient.put(`/admin/orders/${orderId}/payment-status`, {
        payment_status: paymentStatus,
      });
      toast.success("Payment status updated");
      fetchOrdersOnly();
    } catch {
      toast.error("Failed to update payment status");
    }
  };

  const handleExportOrders = async () => {
    try {
      const response = await apiClient.get("/admin/orders/export", {
        params: getOrderFilterParams(),
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "text/csv" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "orders.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Orders CSV downloaded");
    } catch {
      toast.error("Failed to export orders");
    }
  };

  const applyOrderFilters = async () => {
    await fetchOrdersOnly();
  };

  const resetOrderFilters = () => {
    setOrderFilters({
      startDate: "",
      endDate: "",
    });
  };

  /* ── Loading ──────────────────────────── */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ── UI ───────────────────────────────── */
  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-4xl font-bold">Admin Dashboard</h1>
          <Link to="/admin/qr-codes">
            <Button variant="outline" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">QR Codes</span>
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="mb-6">
            <TabsTrigger value="menu">Menu Items</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* ─── MENU ───────────────────────────── */}
          <TabsContent value="menu">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mb-4">
                  <Plus size={16} className="mr-2" /> Add Item
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Item" : "Add Item"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Price (₹)</Label>
                      <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Calories</Label>
                      <Input type="number" value={formData.calories} onChange={(e) => setFormData({ ...formData, calories: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <Label>Categories (comma separated)</Label>
                    <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Coffee, Bestseller, Breakfast" />
                  </div>

                  <div>
                    <Label>Image Source</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" name="imageType" checked={formData.imageType === "url"} onChange={() => setFormData({ ...formData, imageType: "url" })} />
                        Image URL
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" name="imageType" checked={formData.imageType === "file"} onChange={() => setFormData({ ...formData, imageType: "file" })} />
                        Upload Image
                      </label>
                    </div>
                  </div>

                  {formData.imageType === "url" && (
                    <div>
                      <Label>Image URL</Label>
                      <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
                    </div>
                  )}

                  {formData.imageType === "file" && (
                    <div>
                      <Label>Upload Image</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, imageFile: e.target.files[0] })} />
                    </div>
                  )}

                  <div>
                    <Label>Ingredients (comma separated)</Label>
                    <Input value={formData.ingredients} onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })} />
                  </div>

                  {/* DIETARY TAGS */}
                  <div>
                    <Label>Dietary Tags</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { key: "veg", label: "Veg" },
                        { key: "non-veg", label: "Non-Veg" },
                        { key: "vegan", label: "Vegan" },
                        { key: "gluten-free", label: "Gluten-Free" },
                        { key: "nut-free", label: "Nut-Free" },
                        { key: "caffeine-free", label: "Caffeine-Free" },
                      ].map((tag) => {
                        const isChecked = (formData.tags || []).includes(tag.key);
                        return (
                          <label
                            key={tag.key}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                              isChecked
                                ? "bg-primary/10 border-primary/40 text-primary font-medium"
                                : "border-border text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={isChecked}
                              onChange={() => {
                                const next = isChecked
                                  ? (formData.tags || []).filter((t) => t !== tag.key)
                                  : [...(formData.tags || []), tag.key];
                                setFormData({ ...formData, tags: next });
                              }}
                            />
                            {tag.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    {editingItem ? "Update Item" : "Add Item"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl flex items-center gap-4">
                  <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <div className="mt-2 flex items-center gap-3">
                      <Switch
                        checked={!!item.available}
                        onCheckedChange={(checked) => toggleMenuAvailability(item.id, checked)}
                        aria-label={`Toggle availability for ${item.name}`}
                      />
                      <span className={`text-xs font-medium ${item.available ? "text-green-700" : "text-amber-700"}`}>
                        {item.available ? "Available" : "Out of Stock"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">₹{item.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => {
                      setEditingItem(item);
                      setFormData({ ...item, ingredients: item.ingredients.join(", "), tags: item.tags || [] });
                      setDialogOpen(true);
                    }}>
                      <Pencil size={16} />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ─── ORDERS ─────────────────────────── */}
          <TabsContent value="orders">
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border/40 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <div>
                  <Label htmlFor="orders-start-date">Start Date</Label>
                  <Input
                    id="orders-start-date"
                    type="date"
                    value={orderFilters.startDate}
                    onChange={(e) => setOrderFilters((current) => ({ ...current, startDate: e.target.value }))}
                    className="mt-1 w-full sm:w-44"
                  />
                </div>
                <div>
                  <Label htmlFor="orders-end-date">End Date</Label>
                  <Input
                    id="orders-end-date"
                    type="date"
                    value={orderFilters.endDate}
                    onChange={(e) => setOrderFilters((current) => ({ ...current, endDate: e.target.value }))}
                    className="mt-1 w-full sm:w-44"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={applyOrderFilters}>
                    Apply Filter
                  </Button>
                  <Button variant="ghost" onClick={resetOrderFilters}>
                    Reset
                  </Button>
                </div>
              </div>
              <Button variant="outline" onClick={handleExportOrders}>
                Export Orders CSV
              </Button>
            </div>
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl">
                  <Package className="mx-auto mb-4" />
                  <p>No orders yet</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-white p-4 sm:p-6 rounded-xl">
                    <div className="flex flex-col sm:flex-row justify-between mb-2 gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm sm:text-base">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          {order.table_number && (
                            <span className="text-[10px] sm:text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-semibold">
                              Table {order.table_number}
                            </span>
                          )}
                          <span className="text-[10px] sm:text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-semibold">
                            {paymentMethodLabel[order.payment_method] || "Online"}
                          </span>
                          <span
                            className={`text-[10px] sm:text-xs border px-2 py-0.5 rounded-full font-semibold ${paymentStatusStyles[order.payment_status] || paymentStatusStyles.unpaid}`}
                          >
                            {order.payment_status === "paid" ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">{order.user_name}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(order)}</p>
                      </div>
                      <p className="font-bold text-sm sm:text-base">Rs {order.total_amount.toFixed(2)}</p>
                    </div>

                    {order.items.map((item, i) => (
                      <p key={i} className="text-xs sm:text-sm">
                        {item.quantity}x {item.name}
                      </p>
                    ))}

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <Select value={order.status} onValueChange={(s) => updateOrderStatus(order.id, s)}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="preparing">Preparing</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={order.payment_status || "unpaid"}
                        onValueChange={(value) => updatePaymentStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="unpaid">Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ─── ANALYTICS ──────────────────────── */}
          <TabsContent value="analytics">
            <AnalyticsTab orders={orders} menuItems={menuItems} analytics={analytics} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
