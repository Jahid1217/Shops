import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Package, ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { api } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError('Password reset is not configured right now, please contact admin.');
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

          {!success ? (
            <>
              <h2 className="text-2xl font-bold mb-2">Forgot password?</h2>
              <p className="text-neutral-500 text-sm mb-8">Enter your email and we'll send you a reset link.</p>

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MailCheck size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Check your email</h2>
              <p className="text-neutral-500 text-sm mb-8">
                We've sent a password reset link to <span className="font-bold text-neutral-900">{email}</span>.
              </p>
              <Link to="/login" className="inline-flex items-center text-neutral-900 font-bold hover:underline">
                <ArrowLeft className="mr-2" size={16} />
                Back to Login
              </Link>
            </div>
          )}

          {!success && (
            <p className="mt-8 text-center text-sm text-neutral-500">
              Remember your password?{' '}
              <Link to="/login" className="text-neutral-900 font-bold hover:underline">
                Login here
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
