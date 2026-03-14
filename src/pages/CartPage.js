import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../lib/api";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

export const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, getTotal, clearCart, tableNumber } =
    useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const isTableOrder = Boolean(tableNumber);

  const orderItems = cart.map((item) => ({
    menu_item_id: item.id,
    quantity: item.quantity,
  }));

  const buildOrderPayload = (method) => ({
    items: orderItems,
    payment_method: method,
    ...(tableNumber ? { table_number: tableNumber } : {}),
  });

  const ensureUser = () => {
    if (user) {
      return true;
    }

    toast.error("Please sign in to place an order");
    navigate("/login");
    return false;
  };

  const handleCounterCheckout = async () => {
    if (!ensureUser()) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.post("/orders", buildOrderPayload("counter"));
      clearCart();
      toast.success("Order placed. Please pay at the counter.");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to place counter payment order");
    } finally {
      setLoading(false);
    }
  };

  const handleOnlineCheckout = async () => {
    if (!ensureUser()) {
      return;
    }

    try {
      setLoading(true);

      const { data: order } = await apiClient.post("/payments/create-order", {
        items: orderItems,
      });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "CoCoa Cafe",
        description: "Order Payment",
        order_id: order.order_id,
        handler: async (response) => {
          try {
            await apiClient.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            await apiClient.post("/orders", buildOrderPayload("online"));

            clearCart();
            toast.success("Payment successful. Order placed!");
            navigate("/dashboard");
          } catch (err) {
            console.error(err);
            toast.error("Payment verified but order creation failed");
          }
        },
        theme: {
          color: "#6b4f3f",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (paymentMethod === "counter") {
      await handleCounterCheckout();
      return;
    }

    await handleOnlineCheckout();
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-4">
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
          <Button onClick={() => navigate("/menu")}>Browse Menu</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold mb-6">Your Cart</h1>

        <div className="space-y-4 mb-6">
          {cart.map((item) => (
            <motion.div
              key={item.id}
              className="bg-white rounded-2xl p-4 sm:p-6"
            >
              <div className="flex sm:hidden gap-4">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />

                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.category}
                  </p>
                  <p className="font-bold text-sm mt-1">
                    Rs {item.price.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex gap-6">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-24 h-24 rounded-xl object-cover"
                />

                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.category}
                  </p>
                  <p className="font-bold text-lg">Rs {item.price.toFixed(2)}</p>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="mt-4 flex justify-between items-center sm:justify-end sm:gap-4">
                <Button
                  size="icon"
                  variant="ghost"
                  className="sm:hidden"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 size={16} />
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus size={14} />
                  </Button>

                  <span className="text-sm w-4 text-center">
                    {item.quantity}
                  </span>

                  <Button
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-muted/30 p-4 sm:p-8 rounded-2xl">
          <div className="mb-6">
            <p className="text-sm sm:text-base font-semibold mb-3">Payment method</p>
            {isTableOrder ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("online")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    paymentMethod === "online"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-white"
                  }`}
                >
                  <p className="font-semibold">Pay Online</p>
                  <p className="text-sm text-muted-foreground">
                    Pay now and send a confirmed paid order to the kitchen.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("counter")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    paymentMethod === "counter"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-white"
                  }`}
                >
                  <p className="font-semibold">Pay at Counter</p>
                  <p className="text-sm text-muted-foreground">
                    Order from the table now and settle payment at the counter.
                  </p>
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-primary bg-primary/5 p-4">
                <p className="font-semibold">Pay Online</p>
                <p className="text-sm text-muted-foreground">
                  Regular orders are paid online before they are placed.
                </p>
              </div>
            )}
            {isTableOrder && (
              <p className="mt-3 text-sm text-muted-foreground">
                This order will be linked to table {tableNumber}.
              </p>
            )}
          </div>

          <div className="flex justify-between mb-4">
            <span className="text-sm sm:text-lg">Subtotal</span>
            <span className="text-lg sm:text-2xl font-bold">
              Rs {getTotal().toFixed(2)}
            </span>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full h-12 sm:h-14 text-base sm:text-lg"
          >
            {loading
              ? "Processing..."
              : paymentMethod === "online"
                ? "Pay Online"
                : "Place Order and Pay at Counter"}
          </Button>
        </div>
      </div>
    </div>
  );
};
