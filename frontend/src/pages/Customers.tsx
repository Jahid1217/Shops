import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  History,
  X,
  Award,
  Phone,
  MapPin,
  Calendar,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';

export default function Customers() {
  const { hasFeature } = useAuth();
  const canManageCustomers = hasFeature('customers.manage');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const fetchCustomers = async () => {
    try {
      const data = await api.get<any[]>('/customers');
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCustomers) {
      alert("You don't have permission to modify customer data.");
      return;
    }
    try {
      if (currentCustomer) {
        await api.put(`/customers/${currentCustomer.id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      closeModal();
      fetchCustomers();
    } catch (error: any) {
      alert(error.message || 'An error occurred');
    }
  };

  const loadCustomerHistory = async (customer: any) => {
    setCurrentCustomer(customer);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const data = await api.get<any[]>(`/customers/${customer.id}/history`);
      setCustomerHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openModal = (customer: any = null) => {
    if (customer) {
      setCurrentCustomer(customer);
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
      });
    } else {
      setCurrentCustomer(null);
      setFormData({
        name: '',
        phone: '',
        address: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCustomer(null);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Customers</h1>
          <p className="text-neutral-500 font-medium mt-1">Manage client profiles, loyalty points, and purchase history.</p>
        </div>
        <button 
          disabled={!canManageCustomers}
          onClick={() => openModal()}
          className="bg-neutral-900 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-200 transition-all active:scale-95 disabled:opacity-50 disabled:hover:shadow-none"
        >
          <Plus size={20} className="mr-2" />
          Add Customer
        </button>
      </header>

      {/* Search & Filters */}
      <div className="bg-white p-2 rounded-[1.5rem] border border-neutral-200/60 shadow-sm flex items-center group focus-within:ring-2 focus-within:ring-neutral-900/5 transition-all">
        <div className="p-3 text-neutral-400 group-focus-within:text-neutral-900 transition-colors">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Search by name or phone number..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-neutral-900 placeholder:text-neutral-400 font-medium py-3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="text-sm font-bold uppercase tracking-widest">Loading Customers...</p>
          </div>
        ) : filteredCustomers.map((customer, idx) => (
          <motion.div 
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-neutral-200/50 hover:-translate-y-1 transition-all group"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-neutral-900 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-neutral-200/50 font-black text-xl shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => loadCustomerHistory(customer)}
                    className="w-10 h-10 rounded-xl bg-neutral-50 text-neutral-500 flex items-center justify-center hover:bg-neutral-900 hover:text-white transition-colors"
                  >
                    <History size={18} />
                  </button>
                  <button 
                    disabled={!canManageCustomers}
                    onClick={() => openModal(customer)}
                    className="w-10 h-10 rounded-xl bg-neutral-50 text-neutral-500 flex items-center justify-center hover:bg-neutral-900 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-neutral-50 disabled:hover:text-neutral-500"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-neutral-900 mb-1">{customer.name}</h3>
              
              <div className="space-y-3 mt-6">
                <div className="flex items-center text-sm font-medium text-neutral-600">
                  <Phone size={16} className="mr-3 text-neutral-400" />
                  {customer.phone}
                </div>
                {customer.address && (
                  <div className="flex items-center text-sm font-medium text-neutral-600">
                    <MapPin size={16} className="mr-3 text-neutral-400 min-w-4" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
                <div className="flex items-center text-sm font-medium text-neutral-600">
                  <Calendar size={16} className="mr-3 text-neutral-400" />
                  Added: {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-orange-500" />
                <span className="text-xs font-black uppercase tracking-widest text-neutral-500">Loyalty Points</span>
              </div>
              <span className="text-lg font-black text-neutral-900">{customer.points || 0}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-neutral-100"
            >
              <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">{currentCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">Profile information and contact info.</p>
                </div>
                <button onClick={closeModal} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-neutral-400 hover:text-neutral-900">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300"
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Phone Number (Required)</label>
                    <input 
                      required
                      type="tel" 
                      className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300"
                      placeholder="01XXXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Address (Optional)</label>
                    <textarea 
                      className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300 resize-none h-24"
                      placeholder="Customer address..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="px-8 py-3.5 rounded-2xl font-bold text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-neutral-900 text-white px-10 py-3.5 rounded-2xl font-bold hover:bg-neutral-800 hover:shadow-xl hover:shadow-neutral-200 transition-all active:scale-95"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && currentCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
              onClick={() => setIsHistoryModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[85vh]"
            >
              <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Purchase History</h2>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">Showing records for <span className="font-bold text-neutral-700">{currentCustomer.name}</span></p>
                </div>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-neutral-400 hover:text-neutral-900">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-8 custom-scrollbar">
                {loadingHistory ? (
                  <div className="py-20 flex flex-col items-center justify-center text-neutral-400">
                    <Loader2 className="animate-spin mb-4" size={40} />
                    <p className="text-sm font-bold uppercase tracking-widest">Loading Records...</p>
                  </div>
                ) : customerHistory.length > 0 ? (
                  <div className="space-y-4">
                    {customerHistory.map((sale: any) => (
                      <div key={sale.id} className="bg-neutral-50 rounded-2xl border border-neutral-200/60 p-5 p-6 hover:border-neutral-300 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Sale #{sale.id}</span>
                             <p className="text-sm font-bold text-neutral-900 mt-1">{new Date(sale.timestamp).toLocaleString()}</p>
                           </div>
                           <div className="text-right">
                             <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Total Spent</span>
                             <p className="text-xl font-black text-neutral-900 tracking-tight">{formatCurrency(sale.totalPrice)}</p>
                           </div>
                        </div>
                        <div className="space-y-2 border-t border-neutral-200/80 pt-4">
                          {sale.items.map((item: any, i: number) => (
                             <div key={i} className="flex justify-between text-sm font-medium items-center">
                               <div className="flex items-center gap-3">
                                 <span className="w-6 h-6 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-500">{item.qty}x</span>
                                 <span className="text-neutral-700">{item.name}</span>
                               </div>
                               <span className="text-neutral-900 font-bold">{formatCurrency((item.price || 0) * item.qty)}</span>
                             </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History size={24} className="text-neutral-300" />
                    </div>
                    <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">No previous purchases</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
