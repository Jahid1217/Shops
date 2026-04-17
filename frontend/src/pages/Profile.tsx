import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import { 
  UserCircle, 
  Store, 
  Phone, 
  Lock, 
  Save, 
  ShieldCheck,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { profile, isAdmin, login } = useAuth();
  
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    shopName: profile?.shopName || '',
    phoneNumber: profile?.phoneNumber || '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put<any>('/users/me', formData);
      // login also updates context and localStorage
      login({ ...profile, ...response });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPassMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setPassLoading(true);
    setPassMessage({ type: '', text: '' });

    try {
      await api.put('/users/me/password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setPassMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setPassMessage({ type: 'error', text: error.message || 'Failed to change password.' });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Account Profile</h1>
        <p className="text-neutral-500 font-medium mt-1">Manage your personal information and security settings.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - User Overview */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm p-8 flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-neutral-900 to-neutral-800" />
            
            <div className="relative w-28 h-28 bg-white p-2 rounded-[2rem] shadow-xl shadow-neutral-200 mt-4 mb-6">
              <div className="w-full h-full bg-neutral-50 rounded-[1.5rem] flex items-center justify-center border border-neutral-100">
                <span className="text-4xl font-black text-neutral-900">
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">{profile?.username}</h2>
            <p className="text-sm font-medium text-neutral-500 mt-1 mb-6">{profile?.email}</p>

            <div className={`w-full py-3 rounded-2xl flex flex-col items-center justify-center border ${
               isAdmin ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <ShieldCheck size={20} className="mb-1" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isAdmin ? 'Administrator' : 'Staff Member'}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleProfileUpdate}
            className="bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 flex items-center gap-2">
                <UserCircle size={18} className="text-neutral-400" /> General Info
              </h3>
            </div>
            
            <div className="p-8 space-y-6">
              {message.text && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message.type === 'success' && <CheckCircle2 size={18} />}
                  {message.text}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Username</label>
                <div className="relative">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Shop Name</label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium"
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    disabled={!isAdmin}
                    title={!isAdmin ? "Only admins can change shop name" : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-neutral-50/50 border-t border-neutral-100 flex justify-end">
              <button 
                type="submit"
                disabled={loading}
                className="bg-neutral-900 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin ml-2" size={18} /> : <><Save size={18} className="mr-2" /> Save Changes</>}
              </button>
            </div>
          </motion.form>

          {/* Password Form */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handlePasswordUpdate}
            className="bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900 flex items-center gap-2">
                <Lock size={18} className="text-neutral-400" /> Security
              </h3>
            </div>

            <div className="p-8 space-y-6">
              {passMessage.text && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
                  passMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {passMessage.type === 'success' && <CheckCircle2 size={18} />}
                  {passMessage.text}
                </div>
              )}

              <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Current Password</label>
                   <input 
                     required
                     type="password" 
                     className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300"
                     placeholder="••••••••"
                     value={passwordData.oldPassword}
                     onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                   />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">New Password</label>
                     <input 
                       required
                       type="password" 
                       className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300"
                       placeholder="••••••••"
                       value={passwordData.newPassword}
                       onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Confirm New</label>
                     <input 
                       required
                       type="password" 
                       className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300"
                       placeholder="••••••••"
                       value={passwordData.confirmPassword}
                       onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                     />
                   </div>
                 </div>
              </div>
            </div>

            <div className="p-6 bg-neutral-50/50 border-t border-neutral-100 flex justify-end">
              <button 
                type="submit"
                disabled={passLoading}
                className="bg-neutral-900 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50"
              >
                {passLoading ? <Loader2 className="animate-spin ml-2" size={18} /> : <><Lock size={18} className="mr-2" /> Update Password</>}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
