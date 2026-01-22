import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, getTotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to place an order');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total_amount: getTotal(),
      };

      const response = await axios.post(`${API}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/order/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-24" data-testid="empty-cart">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-primary mb-4">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Add some delicious items from our menu</p>
          <Button
            onClick={() => navigate('/menu')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-12 px-8"
            data-testid="browse-menu-button"
          >
            Browse Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 md:px-12" data-testid="cart-page">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-primary mb-8">Your Cart</h1>

        <div className="space-y-4 mb-8">
          {cart.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-2xl border border-border p-6 flex gap-6"
              data-testid={`cart-item-${item.id}`}
            >
              <img
                src={item.image_url}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-xl"
              />

              <div className="flex-1">
                <h3 className="text-lg font-heading font-semibold text-primary mb-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{item.category}</p>
                <p className="text-lg font-bold text-primary">${item.price.toFixed(2)}</p>
              </div>

              <div className="flex flex-col items-end justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  data-testid={`remove-item-${item.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full"
                    data-testid={`decrease-quantity-${item.id}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-medium" data-testid={`quantity-${item.id}`}>{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full"
                    data-testid={`increase-quantity-${item.id}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-muted/30 rounded-2xl border border-border p-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-medium text-foreground">Subtotal</span>
            <span className="text-2xl font-heading font-bold text-primary" data-testid="cart-total">${getTotal().toFixed(2)}</span>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 rounded-full text-lg font-medium transition-all hover:scale-105 active:scale-95"
            data-testid="checkout-button"
          >
            {loading ? 'Processing...' : 'Checkout'}
          </Button>

          {!user && (
            <p className="text-sm text-center text-muted-foreground mt-4">
              Please sign in to complete your order
            </p>
          )}
        </div>
      </div>
    </div>
  );
};