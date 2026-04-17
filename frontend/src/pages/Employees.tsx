import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  X,
  Mail,
  Phone,
  Shield,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Employees() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    salary: 0,
    gender: 'Male',
    address: '',
    position: 'Staff',
  });

  const fetchEmployees = async () => {
    try {
      const data = await api.get<any[]>('/employees');
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentEmployee) {
        await api.put(`/employees/${currentEmployee.id}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      closeModal();
      fetchEmployees();
    } catch (error: any) {
      alert(error.message || 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/employees/${id}`);
        fetchEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
      }
    }
  };

  const openModal = (employee: any = null) => {
    if (employee) {
      setCurrentEmployee(employee);
      setFormData({
        name: employee.name,
        phone: employee.phone || '',
        email: employee.email || '',
        password: '',
        salary: employee.salary || 0,
        gender: employee.gender || 'Male',
        address: employee.address || '',
        position: employee.position || 'Staff',
      });
    } else {
      setCurrentEmployee(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        password: '',
        salary: 0,
        gender: 'Male',
        address: '',
        position: 'Staff',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentEmployee(null);
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.position?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-6">
          <Shield size={32} />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-neutral-900 mb-2">Access Denied</h2>
        <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">Only administrators can view staff records</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Employees & Staff</h1>
          <p className="text-neutral-500 font-medium mt-1">Manage personnel, roles, and salary information.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-neutral-900 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-200 transition-all active:scale-95"
        >
          <Plus size={20} className="mr-2" />
          Add Employee
        </button>
      </header>

      {/* Search */}
      <div className="bg-white p-2 rounded-[1.5rem] border border-neutral-200/60 shadow-sm flex items-center group focus-within:ring-2 focus-within:ring-neutral-900/5 transition-all">
        <div className="p-3 text-neutral-400 group-focus-within:text-neutral-900 transition-colors">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Search staff by name or role..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-neutral-900 placeholder:text-neutral-400 font-medium py-3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Employee</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Contact</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Role & Position</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Salary</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-neutral-300" size={40} />
                    <p className="text-xs font-bold text-neutral-400 mt-4 uppercase tracking-widest">Loading Staff Data...</p>
                  </td>
                </tr>
              ) : filteredEmployees.length > 0 ? filteredEmployees.map((employee, idx) => (
                <motion.tr 
                  key={employee.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-neutral-50/50 transition-colors group"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-neutral-900 text-white rounded-[1rem] flex items-center justify-center shadow-lg shadow-neutral-200 font-black text-lg">
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900">{employee.name}</p>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight mt-0.5">{employee.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1.5">
                      {employee.phone && (
                        <div className="flex items-center text-xs font-bold text-neutral-500">
                          <Phone size={12} className="mr-2" /> {employee.phone}
                        </div>
                      )}
                      {employee.email && (
                        <div className="flex items-center text-xs text-neutral-500 font-medium">
                          <Mail size={12} className="mr-2" /> {employee.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                      {employee.position}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-black text-neutral-900 text-sm">
                      {formatCurrency(employee.salary)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => openModal(employee)}
                        className="p-2.5 text-neutral-400 hover:text-neutral-900 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(employee.id)}
                        className="p-2.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users size={24} className="text-neutral-300" />
                    </div>
                    <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">No staff found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">{currentEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">Staff details and compensation.</p>
                </div>
                <button onClick={closeModal} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-neutral-400 hover:text-neutral-900">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 pb-2 border-b border-neutral-100">
                      <Users size={16} className="text-neutral-400" /> Personal Info
                    </h3>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Full Name</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Gender</label>
                        <select 
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-bold appearance-none bg-white"
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        >
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Phone</label>
                        <input 
                          type="tel" 
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Address</label>
                      <textarea 
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium resize-none h-20"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 pb-2 border-b border-neutral-100">
                      <Shield size={16} className="text-neutral-400" /> Role & Access
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Position</label>
                        <select 
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-bold appearance-none bg-white"
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        >
                          <option value="Staff">Staff</option>
                          <option value="Manager">Manager</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Salary</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">৳</span>
                          <input 
                            required
                            type="number" 
                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-black"
                            value={formData.salary}
                            onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">System Email Login</label>
                      <input 
                        type="email" 
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300"
                        placeholder="employee@shop.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    {/* Simplified for demo: no new password hashing sent via UI unless required, API handles it if empty default */}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 shrink-0">
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
                    Save Options
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
