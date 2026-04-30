import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  UserCircle, 
  History, 
  LogOut,
  Menu,
  X,
  UserPlus,
  Activity,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import React, { useState } from 'react';

import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profile, isAdmin, hasMenu, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    logout();
    navigate('/');
  };

  const navItems = [
    ...(hasMenu('dashboard') ? [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }] : []),
    ...(hasMenu('inventory') ? [{ name: 'Inventory', path: '/inventory', icon: Package }] : []),
    ...(hasMenu('pos') ? [{ name: 'POS (Sales)', path: '/pos', icon: ShoppingCart }] : []),
    ...(hasMenu('customers') ? [{ name: 'Customers', path: '/customers', icon: Users }] : []),
    ...(hasMenu('reports') ? [{ name: 'Reports', path: '/reports', icon: BarChart3 }] : []),
    ...(isAdmin && hasMenu('employees') ? [
      { name: 'Employees', path: '/employees', icon: UserPlus },
    ] : []),
    ...(hasMenu('audit-logs') ? [
      { name: 'Audit Logs', path: '/audit-logs', icon: Activity }
    ] : []),
    ...(hasMenu('history') ? [{ name: 'History', path: '/history', icon: History }] : []),
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans selection:bg-neutral-900 selection:text-white overflow-hidden">
      {/* Mobile Sidebar Toggle */}
      <button 
        className="lg:hidden fixed top-6 right-6 z-50 w-12 h-12 bg-white rounded-2xl shadow-xl shadow-neutral-200 border border-neutral-100 flex items-center justify-center text-neutral-600 active:scale-90 transition-all"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-neutral-200/60 transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 lg:static lg:inset-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full shadow-none"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-neutral-900 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-neutral-300 group-hover:rotate-12 transition-transform">
                <Package className="text-white" size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-neutral-900 tracking-tighter leading-none">StockMaster</h1>
                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.3em] mt-1.5">
                  {profile?.shopName || 'Inventory System'}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-6 py-4 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "group relative flex items-center px-5 py-4 text-sm font-black uppercase tracking-widest rounded-2xl transition-all duration-300",
                    isActive
                      ? "bg-neutral-900 text-white shadow-xl shadow-neutral-200 translate-x-1"
                      : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 hover:translate-x-1"
                  )}
                >
                  <item.icon className={cn("mr-4 transition-all duration-300", isActive ? "scale-110" : "opacity-50 group-hover:opacity-100 group-hover:scale-110")} size={18} />
                  <span className="flex-1 text-[10px]">{item.name}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeNavIndicator"
                      className="absolute right-4"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    </motion.div>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-8 border-t border-neutral-100 bg-neutral-50/50">
            <div className="flex items-center gap-4 mb-8 px-2">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-neutral-100 font-black text-neutral-400 text-xs">
                {profile?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-neutral-900 truncate tracking-tight">{profile?.username}</p>
                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest truncate">{isAdmin ? 'Administrator' : 'Staff Member'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 rounded-2xl hover:bg-red-50 transition-all duration-300 group active:scale-95"
            >
              <LogOut className="mr-4 transition-transform group-hover:-translate-x-1" size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar bg-neutral-50/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-7xl mx-auto w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
