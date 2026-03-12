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
import { Textarea } from "../components/ui/textarea";
import { Plus, Pencil, Trash2, Package, QrCode, TrendingUp, ShoppingCart, IndianRupee, Clock } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../lib/api";
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
  const date =
    typeof raw === "string" && !raw.includes("Z")
      ? new Date(raw + "Z")
      : new Date(raw);
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
const AnalyticsTab = ({ orders, menuItems }) => {
  const { totalRevenue, totalOrders, avgOrderValue, pendingOrders, dailyRevenue, categoryRevenue, topItems } =
    buildAnalytics(orders, menuItems);

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={IndianRupee} label="Total Revenue" value={`₹${totalRevenue.toFixed(2)}`} color="bg-primary" />
        <KpiCard icon={ShoppingCart} label="Total Orders" value={totalOrders} color="bg-accent" />
        <KpiCard icon={TrendingUp} label="Avg Order Value" value={`₹${avgOrderValue.toFixed(2)}`} color="bg-green-600" />
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

  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

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

  /* ── Fetch ────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      const [menuRes, orderRes] = await Promise.all([
        axios.get(`${API}/menu/items`),
        axios.get(`${API}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setMenuItems(menuRes.data);
      setOrders(orderRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, token]);

  const fetchOrdersOnly = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      console.error("Order polling failed");
    }
  }, [handleUnauthorized, token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    if (!token) {
      handleUnauthorized();
      return;
    }
    fetchData();
    intervalRef.current = setInterval(fetchOrdersOnly, 5000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [authLoading, fetchData, fetchOrdersOnly, handleUnauthorized, navigate, token, user]);

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
        await axios.put(`${API}/menu/items/${editingItem.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Menu item updated");
      } else {
        await axios.post(`${API}/menu/items`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
      await axios.delete(`${API}/menu/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Item deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete item");
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
      await axios.put(
        `${API}/admin/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Order status updated");
      fetchOrdersOnly();
    } catch {
      toast.error("Failed to update order");
    }
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

              <DialogContent>
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
                    <Label>Category</Label>
                    <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
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
                        { key: "vegan", label: "🌱 Vegan" },
                        { key: "gluten-free", label: "🌾 Gluten-Free" },
                        { key: "nut-free", label: "🥜 Nut-Free" },
                        { key: "caffeine-free", label: "☕ Caffeine-Free" },
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
                              📍 Table {order.table_number}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">{order.user_name}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(order)}</p>
                      </div>
                      <p className="font-bold text-sm sm:text-base">₹{order.total_amount.toFixed(2)}</p>
                    </div>

                    {order.items.map((item, i) => (
                      <p key={i} className="text-xs sm:text-sm">
                        {item.quantity}× {item.name}
                      </p>
                    ))}

                    <Select value={order.status} onValueChange={(s) => updateOrderStatus(order.id, s)}>
                      <SelectTrigger className="w-full sm:w-48 mt-3">
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

          {/* ─── ANALYTICS ──────────────────────── */}
          <TabsContent value="analytics">
            <AnalyticsTab orders={orders} menuItems={menuItems} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
