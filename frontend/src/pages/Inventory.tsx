import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  QrCode, 
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Inventory() {
  const { profile, isAdmin } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    quantity: 0,
    buyingPrice: 0,
    sellingPrice: 0,
    batchNumber: '',
    mfgDate: '',
    expDate: '',
    discountType: 'percent' as 'percent' | 'fixed',
    discountValue: 0,
  });

  const fetchItems = async () => {
    try {
      const data = await api.get<any[]>('/items');
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
      scanner.render(onScanSuccess, onScanError);
      return () => scanner.clear();
    }
  }, [isScanning]);

  const checkBarcode = async (barcode: string) => {
    if (!barcode) return;
    try {
      const result = await api.get<any>(`/items/barcode/${barcode}`);
      if (result && !result.found === false) {
        setFormData(prev => ({ 
          ...prev, 
          name: result.name,
          buyingPrice: result.buyingPrice,
          sellingPrice: result.sellingPrice,
          batchNumber: result.batchNumber || '',
          mfgDate: result.mfgDate || '',
          expDate: result.expDate || '',
          discountType: result.discountType || 'percent',
          discountValue: result.discountValue || 0,
        }));
      }
    } catch (error) {
      // Item not found, that's fine
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    setIsScanning(false);
    setFormData(prev => ({ ...prev, barcode: decodedText }));
    await checkBarcode(decodedText);
  };

  const onScanError = (err: any) => {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentItem) {
        await api.put(`/items/${currentItem.id}`, formData);
      } else {
        await api.post('/items', formData);
      }
      closeModal();
      fetchItems();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleDelete = async (id: string, itemName: string) => {
    if (!isAdmin) {
      alert("Only admins can delete items.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/items/${id}`);
        fetchItems();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const openModal = (item: any = null) => {
    if (item) {
      setCurrentItem(item);
      setFormData({
        barcode: item.barcode,
        name: item.name,
        quantity: item.quantity,
        buyingPrice: item.buyingPrice,
        sellingPrice: item.sellingPrice,
        batchNumber: item.batchNumber || '',
        mfgDate: item.mfgDate || '',
        expDate: item.expDate || '',
        discountType: item.discountType || 'percent',
        discountValue: item.discountValue || 0,
      });
    } else {
      setCurrentItem(null);
      setFormData({
        barcode: '',
        name: '',
        quantity: 0,
        buyingPrice: 0,
        sellingPrice: 0,
        batchNumber: '',
        mfgDate: '',
        expDate: '',
        discountType: 'percent',
        discountValue: 0,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsScanning(false);
    setCurrentItem(null);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.barcode.includes(search)
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Inventory</h1>
          <p className="text-neutral-500 font-medium mt-1">Manage your stock, prices, and scan barcodes with ease.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-neutral-900 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-200 transition-all active:scale-95"
        >
          <Plus size={20} className="mr-2" />
          Add New Item
        </button>
      </header>

      {/* Search & Filters */}
      <div className="bg-white p-2 rounded-[1.5rem] border border-neutral-200/60 shadow-sm flex items-center group focus-within:ring-2 focus-within:ring-neutral-900/5 transition-all">
        <div className="p-3 text-neutral-400 group-focus-within:text-neutral-900 transition-colors">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Search by name or barcode..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-neutral-900 placeholder:text-neutral-400 font-medium py-3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Item Details</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Barcode</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Stock</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Price (Buy/Sell)</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Discount</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-neutral-300" size={40} />
                    <p className="text-xs font-bold text-neutral-400 mt-4 uppercase tracking-widest">Loading Inventory...</p>
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? filteredItems.map((item, idx) => (
                <motion.tr 
                  key={item.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-neutral-50/50 transition-colors group"
                >
                  <td className="px-8 py-5">
                    <p className="font-bold text-neutral-900 group-hover:text-black transition-colors">{item.name}</p>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight mt-0.5">Batch: {item.batchNumber || 'N/A'}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-mono text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2.5 py-1.5 rounded-lg border border-neutral-200/50">
                      {item.barcode}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <p className={cn(
                        "text-sm font-black",
                        item.quantity <= 5 ? "text-orange-600" : "text-neutral-900"
                      )}>
                        {item.quantity}
                      </p>
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">Units</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-neutral-400">B: {formatCurrency(item.buyingPrice)}</p>
                      <p className="text-sm font-black text-neutral-900">S: {formatCurrency(item.sellingPrice)}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {item.discountValue > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-green-600">
                          {item.discountType === 'percent' ? `${item.discountValue}%` : formatCurrency(item.discountValue)}
                        </span>
                        <span className="text-[9px] font-bold text-green-600/60 uppercase tracking-tighter">OFF</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">None</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    {item.quantity <= 0 ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">
                        Out of Stock
                      </span>
                    ) : item.quantity <= 5 ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-100">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => openModal(item)}
                        className="p-2.5 text-neutral-400 hover:text-neutral-900 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id, item.name)}
                        className={cn(
                          "p-2.5 rounded-xl transition-all",
                          isAdmin 
                            ? "text-neutral-400 hover:text-red-600 hover:bg-red-50" 
                            : "text-neutral-200 cursor-not-allowed"
                        )}
                        title={isAdmin ? "Delete Item" : "Only admins can delete"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-8 py-24 text-center">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="text-neutral-300" />
                    </div>
                    <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">No items found</p>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-neutral-100"
            >
              <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">{currentItem ? 'Edit Item' : 'Add New Item'}</h2>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">Fill in the details below to update your inventory.</p>
                </div>
                <button onClick={closeModal} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-neutral-400 hover:text-neutral-900">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Barcode / QR Code</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1 group">
                        <input 
                          required
                          type="text" 
                          className="w-full pl-4 pr-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300"
                          placeholder="Scan or enter barcode"
                          value={formData.barcode}
                          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                          onBlur={(e) => checkBarcode(e.target.value)}
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsScanning(!isScanning)}
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all active:scale-95",
                          isScanning 
                            ? "bg-red-50 border-red-200 text-red-600 shadow-inner" 
                            : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-white hover:shadow-md"
                        )}
                      >
                        <QrCode size={22} />
                      </button>
                    </div>
                    {isScanning && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 rounded-2xl overflow-hidden border-2 border-dashed border-neutral-200 p-2 bg-neutral-50"
                      >
                        <div id="reader" className="rounded-xl overflow-hidden" />
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Item Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300"
                      placeholder="Product Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Quantity</label>
                    <input 
                      required
                      type="number" 
                      className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-black"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Buying Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">৳</span>
                        <input 
                          required
                          type="number" 
                          className="w-full pl-8 pr-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-black"
                          value={formData.buyingPrice}
                          onChange={(e) => setFormData({ ...formData, buyingPrice: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Selling Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">৳</span>
                        <input 
                          required
                          type="number" 
                          className="w-full pl-8 pr-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-black"
                          value={formData.sellingPrice}
                          onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Discount Type</label>
                      <select 
                        className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-bold appearance-none bg-white"
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percent' | 'fixed' })}
                      >
                        <option value="percent">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (Tk)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Discount Value</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-black"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Batch Number</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300"
                      placeholder="e.g. BATCH-001"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">MFG Date</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-bold"
                        value={formData.mfgDate}
                        onChange={(e) => setFormData({ ...formData, mfgDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">EXP Date</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-bold"
                        value={formData.expDate}
                        onChange={(e) => setFormData({ ...formData, expDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex justify-end gap-3">
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
                    {currentItem ? 'Save Changes' : 'Add to Inventory'}
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
