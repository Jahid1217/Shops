import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Package, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post<any>('/auth/login', formData);
      login(response);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <Package className="text-white" size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight">StockMaster Pro</span>
          </div>

          <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-neutral-500 text-sm mb-8">Login to manage your inventory and sales.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Email Address</label>
              <input
                required
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Password</label>
                <Link to="/forgot-password" title="Reset Password" className="text-xs font-bold text-neutral-400 hover:text-neutral-900">Forgot?</Link>
              </div>
              <input
                required
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-neutral-900 text-white py-4 rounded-xl font-bold flex items-center justify-center group hover:bg-neutral-800 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Login to Dashboard
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-neutral-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-neutral-900 font-bold hover:underline">
              Register your shop
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
