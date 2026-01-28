import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/* ---------------- DATE + TIME (IST SAFE) ---------------- */
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
/* ------------------------------------------------------- */

export const AdminDashboard = () => {
  const { user, token, loading: authLoading } = useAuth();
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
  });

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") return navigate("/");

    fetchData();
    intervalRef.current = setInterval(fetchOrdersOnly, 5000);

    return () => clearInterval(intervalRef.current);
  }, [user, authLoading, navigate]);

  /* ---------------- FETCH ---------------- */
  const fetchData = async () => {
    try {
      const [menuRes, orderRes] = await Promise.all([
        axios.get(`${API}/menu/items`),
        axios.get(`${API}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setMenuItems(menuRes.data);
      setOrders(orderRes.data);
    } catch {
      toast.error("Failed to load admin data");
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
      console.error("Order polling failed");
    }
  };

  /* ---------------- MENU CRUD ---------------- */
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
    });
  };

  /* ---------------- ORDER STATUS ---------------- */
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

  /* ---------------- LOADING ---------------- */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold mb-6">Admin Dashboard</h1>

        <Tabs defaultValue="orders">
          <TabsList className="mb-6">
            <TabsTrigger value="menu">Menu Items</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          {/* ---------------- MENU ---------------- */}
          <TabsContent value="menu">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mb-4">
                  <Plus size={16} className="mr-2" /> Add Item
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Item" : "Add Item"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* NAME */}
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* DESCRIPTION */}
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* PRICE + CALORIES */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Price (₹)</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Calories</Label>
                      <Input
                        type="number"
                        value={formData.calories}
                        onChange={(e) =>
                          setFormData({ ...formData, calories: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* CATEGORY */}
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    />
                  </div>

                  {/* IMAGE SOURCE SELECT */}
                  <div>
                    <Label>Image Source</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="imageType"
                          checked={formData.imageType === "url"}
                          onChange={() =>
                            setFormData({ ...formData, imageType: "url" })
                          }
                        />
                        Image URL
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="imageType"
                          checked={formData.imageType === "file"}
                          onChange={() =>
                            setFormData({ ...formData, imageType: "file" })
                          }
                        />
                        Upload Image
                      </label>
                    </div>
                  </div>

                  {/* IMAGE URL */}
                  {formData.imageType === "url" && (
                    <div>
                      <Label>Image URL</Label>
                      <Input
                        value={formData.image_url}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            image_url: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  {/* IMAGE FILE */}
                  {formData.imageType === "file" && (
                    <div>
                      <Label>Upload Image</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            imageFile: e.target.files[0],
                          })
                        }
                      />
                    </div>
                  )}

                  {/* INGREDIENTS */}
                  <div>
                    <Label>Ingredients (comma separated)</Label>
                    <Input
                      value={formData.ingredients}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ingredients: e.target.value,
                        })
                      }
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    {editingItem ? "Update Item" : "Add Item"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-xl flex items-center gap-4"
                >
                  {/* IMAGE PREVIEW */}
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />

                  {/* TEXT */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500">₹{item.price}</p>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setEditingItem(item);
                        setFormData({
                          ...item,
                          ingredients: item.ingredients.join(", "),
                        });
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil size={16} />
                    </Button>

                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ---------------- ORDERS ---------------- */}
          <TabsContent value="orders">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl">
                  <Package className="mx-auto mb-4" />
                  <p>No orders yet</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white p-4 sm:p-6 rounded-xl"
                  >
                    <div className="flex flex-col sm:flex-row justify-between mb-2 gap-2">
                      <div>
                        <p className="font-semibold text-sm sm:text-base">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {order.user_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(order)}
                        </p>
                      </div>

                      <p className="font-bold text-sm sm:text-base">
                        ₹{order.total_amount.toFixed(2)}
                      </p>
                    </div>

                    {order.items.map((item, i) => (
                      <p key={i} className="text-xs sm:text-sm">
                        {item.quantity}× {item.name}
                      </p>
                    ))}

                    <Select
                      value={order.status}
                      onValueChange={(s) => updateOrderStatus(order.id, s)}
                    >
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
        </Tabs>
      </div>
    </div>
  );
};
