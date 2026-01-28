import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    if (!email) {
      toast.error('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Enter a valid email');
      return false;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password);
      rememberMe
        ? localStorage.setItem('remember_email', email)
        : localStorage.removeItem('remember_email');
      toast.success('Welcome back!');
      navigate('/menu');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl sm:rounded-3xl border p-6 sm:p-8 shadow-lg">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 sm:h-12"
              />
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 sm:h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-primary"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-primary">
                Forgot?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 rounded-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm">
            Don’t have an account?{' '}
            <Link to="/signup" className="text-primary font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
