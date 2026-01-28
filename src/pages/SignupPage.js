import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (name.trim().length < 2) {
      toast.error('Enter your full name');
      return false;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signup(name, email, password);
      toast.success('Account created!');
      navigate('/menu');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed');
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
              Create Account
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Join CoCoa community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 sm:h-12"
              />
            </div>

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

            <div>
              <Label>Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 sm:h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 rounded-full"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
