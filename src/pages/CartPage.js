import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, getTotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // ---------------- CHECKOUT ----------------
  const handleCheckout = async () => {
    if (!user) {
      toast.error("Please sign in to place an order");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Create Razorpay order
      const { data: order } = await axios.post(
        `${API}/payments/create-order`,
        { amount: getTotal() }, // USD amount
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 2️⃣ Open Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "CoCoa Cafe",
        description: "Order Payment",
        order_id: order.order_id,

        handler: async function (response) {
          try {
            // 3️⃣ Verify payment
            await axios.post(
              `${API}/payments/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            // 4️⃣ Create order in DB
            await axios.post(
              `${API}/orders`,
              {
                items: cart.map((item) => ({
                  menu_item_id: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                })),
                total_amount: getTotal(),
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            clearCart();
            toast.success("Payment successful 🎉 Order placed!");
            navigate("/dashboard");
          } catch (err) {
            console.error(err);
            toast.error("Payment verified but order failed");
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

  // ---------------- EMPTY CART ----------------
  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <Button onClick={() => navigate("/menu")}>Browse Menu</Button>
        </div>
      </div>
    );
  }

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen pt-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Your Cart</h1>

        <div className="space-y-4 mb-8">
          {cart.map((item) => (
            <motion.div
              key={item.id}
              className="bg-white p-6 rounded-2xl flex gap-6"
            >
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
                <p className="font-bold text-lg">₹{item.price.toFixed(2)}</p>
              </div>

              <div className="flex flex-col items-end justify-between">
                <Button
                  variant="ghost"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    onClick={() =>
                      updateQuantity(item.id, item.quantity - 1)
                    }
                  >
                    <Minus size={14} />
                  </Button>

                  <span>{item.quantity}</span>

                  <Button
                    size="icon"
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1)
                    }
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-muted/30 p-8 rounded-2xl">
          <div className="flex justify-between mb-6">
            <span className="text-lg">Subtotal</span>
            <span className="text-2xl font-bold">
              ₹ {getTotal().toFixed(2)}
            </span>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full h-14 text-lg"
          >
            {loading ? "Processing..." : "Checkout"}
          </Button>
        </div>
      </div>
    </div>
  );
};
