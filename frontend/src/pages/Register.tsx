import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Package, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    shopName: '',
    phone: '',
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
      const response = await api.post<any>('/auth/register', formData);
      login(response);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
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

          <h2 className="text-2xl font-bold mb-2">Create your account</h2>
          <p className="text-neutral-500 text-sm mb-8">Start managing your inventory professionally today.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Username</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Phone</label>
                <input
                  required
                  type="tel"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                  placeholder="017XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Shop Name</label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                placeholder="My Awesome Shop"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              />
            </div>

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
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Password</label>
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
                  Create Account
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <Link to="/login" className="text-neutral-900 font-bold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
