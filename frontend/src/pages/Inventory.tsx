import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  QrCode,
  X,
  Loader2,
  Printer,
  Barcode,
  WandSparkles,
  Save,
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useReactToPrint } from 'react-to-print';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type ItemFormData = {
  barcode: string;
  qrCode: string;
  name: string;
  quantity: string;
  buyingPrice: string;
  sellingPrice: string;
  batchNumber: string;
  mfgDate: string;
  expDate: string;
  discountType: 'percent' | 'fixed';
  discountValue: string;
};

type CodePreview = {
  itemId: number;
  itemName: string;
  sellingPrice: number;
  barcode: string | null;
  qrCode: string | null;
  barcodeImage: string | null;
  qrCodeImage: string | null;
};

export default function Inventory() {
  const { hasFeature } = useAuth();
  const canDeleteInventory = hasFeature('inventory.delete');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [isExistingBarcodeItem, setIsExistingBarcodeItem] = useState(false);

  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeItem, setCodeItem] = useState<any>(null);
  const [codeForm, setCodeForm] = useState({ barcode: '', qrCode: '' });
  const [codePreview, setCodePreview] = useState<CodePreview | null>(null);

  const printLabelRef = useRef<HTMLDivElement>(null);
  const printLabel = useReactToPrint({
    contentRef: printLabelRef,
    documentTitle: () => `Label-${codePreview?.itemName || 'Product'}`,
  });

  const [formData, setFormData] = useState<ItemFormData>({
    barcode: '',
    qrCode: '',
    name: '',
    quantity: '0',
    buyingPrice: '0',
    sellingPrice: '0',
    batchNumber: '',
    mfgDate: '',
    expDate: '',
    discountType: 'percent',
    discountValue: '0',
  });

  const normalizeNumberInput = (value: string) => {
    if (value.trim() === '') return 0;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const autoSelectDefaultZero = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
      e.target.select();
    }
  };

  const fetchItems = async () => {
    try {
      const data = await api.get<any[]>('/items');
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 250 }, false);
      scanner.render(onScanSuccess, onScanError);
      return () => scanner.clear();
    }
  }, [isScanning]);

  const checkBarcode = async (code: string) => {
    if (!code) {
      setIsExistingBarcodeItem(false);
      return;
    }
    try {
      const result = await api.get<any>(`/items/barcode/${code}`);
      if (result && result.found !== false) {
        setIsExistingBarcodeItem(true);
        setFormData((prev) => ({
          ...prev,
          name: result.name,
          buyingPrice: String(result.buyingPrice ?? 0),
          sellingPrice: String(result.sellingPrice ?? 0),
          batchNumber: result.batchNumber || '',
          mfgDate: result.mfgDate || '',
          expDate: result.expDate || '',
          discountType: result.discountType || 'percent',
          discountValue: String(result.discountValue ?? 0),
          qrCode: result.qrCode || '',
        }));
      } else {
        setIsExistingBarcodeItem(false);
      }
    } catch {
      setIsExistingBarcodeItem(false);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    setIsScanning(false);
    setFormData((prev) => ({ ...prev, barcode: decodedText }));
    await checkBarcode(decodedText);
  };

  const onScanError = (_err: any) => {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      barcode: formData.barcode.trim() || null,
      qrCode: formData.qrCode.trim() || null,
      quantity: normalizeNumberInput(formData.quantity),
      buyingPrice: normalizeNumberInput(formData.buyingPrice),
      sellingPrice: normalizeNumberInput(formData.sellingPrice),
      discountValue: normalizeNumberInput(formData.discountValue),
    };

    try {
      if (currentItem) {
        await api.put(`/items/${currentItem.id}`, payload);
      } else {
        await api.post('/items', payload);
      }
      closeModal();
      fetchItems();
    } catch (error: any) {
      alert(error?.message || 'Error saving item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDeleteInventory) {
      alert("You don't have permission to delete items.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/items/${id}`);
        fetchItems();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const openModal = (item: any = null) => {
    if (item) {
      setCurrentItem(item);
      setIsExistingBarcodeItem(false);
      setFormData({
        barcode: item.barcode || '',
        qrCode: item.qrCode || '',
        name: item.name,
        quantity: String(item.quantity ?? 0),
        buyingPrice: String(item.buyingPrice ?? 0),
        sellingPrice: String(item.sellingPrice ?? 0),
        batchNumber: item.batchNumber || '',
        mfgDate: item.mfgDate || '',
        expDate: item.expDate || '',
        discountType: item.discountType || 'percent',
        discountValue: String(item.discountValue ?? 0),
      });
    } else {
      setCurrentItem(null);
      setIsExistingBarcodeItem(false);
      setFormData({
        barcode: '',
        qrCode: '',
        name: '',
        quantity: '0',
        buyingPrice: '0',
        sellingPrice: '0',
        batchNumber: '',
        mfgDate: '',
        expDate: '',
        discountType: 'percent',
        discountValue: '0',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsScanning(false);
    setCurrentItem(null);
    setIsExistingBarcodeItem(false);
  };

  const fetchCodePreview = async (itemId: number) => {
    const preview = await api.get<CodePreview>(`/items/${itemId}/codes`);
    setCodePreview(preview);
    return preview;
  };

  const openCodeModal = async (item: any) => {
    setCodeItem(item);
    setCodeForm({
      barcode: item.barcode || '',
      qrCode: item.qrCode || '',
    });
    setIsCodeModalOpen(true);
    setCodeBusy(true);
    try {
      await fetchCodePreview(item.id);
    } catch (error) {
      console.error('Failed to fetch code preview:', error);
    } finally {
      setCodeBusy(false);
    }
  };

  const closeCodeModal = () => {
    setIsCodeModalOpen(false);
    setCodeBusy(false);
    setCodeItem(null);
    setCodePreview(null);
    setCodeForm({ barcode: '', qrCode: '' });
  };

  const generateCodes = async (overwrite = false) => {
    if (!codeItem) return;
    setCodeBusy(true);
    try {
      const updated = await api.post<any>(`/items/${codeItem.id}/codes/generate`, {
        barcode: true,
        qrCode: true,
        overwrite,
      });
      setCodeForm({ barcode: updated.barcode || '', qrCode: updated.qrCode || '' });
      setCodeItem(updated);
      await fetchCodePreview(codeItem.id);
      await fetchItems();
    } catch (error: any) {
      alert(error?.message || 'Failed to generate codes');
    } finally {
      setCodeBusy(false);
    }
  };

  const saveCodes = async () => {
    if (!codeItem) return;
    setCodeBusy(true);
    try {
      const updated = await api.put<any>(`/items/${codeItem.id}/codes`, {
        barcode: codeForm.barcode.trim() || null,
        qrCode: codeForm.qrCode.trim() || null,
      });
      setCodeItem(updated);
      await fetchCodePreview(codeItem.id);
      await fetchItems();
    } catch (error: any) {
      alert(error?.message || 'Failed to update codes');
    } finally {
      setCodeBusy(false);
    }
  };

  const deleteCodes = async (type: 'barcode' | 'qrcode' | 'both') => {
    if (!codeItem) return;
    setCodeBusy(true);
    try {
      const updated = await api.delete<any>(`/items/${codeItem.id}/codes?type=${type}`);
      setCodeItem(updated);
      setCodeForm({ barcode: updated.barcode || '', qrCode: updated.qrCode || '' });
      await fetchCodePreview(codeItem.id);
      await fetchItems();
    } catch (error: any) {
      alert(error?.message || 'Failed to delete codes');
    } finally {
      setCodeBusy(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!codeItem) return;
    if (!codePreview) {
      await fetchCodePreview(codeItem.id);
    }
    printLabel();
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.barcode || '').includes(search) ||
      (item.qrCode || '').includes(search)
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Inventory</h1>
          <p className="text-neutral-500 font-medium mt-1">
            Manage stock and generate, print, and manage barcode/QR labels.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-neutral-900 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-200 transition-all active:scale-95"
        >
          <Plus size={20} className="mr-2" />
          Add New Item
        </button>
      </header>

      <div className="bg-white p-2 rounded-[1.5rem] border border-neutral-200/60 shadow-sm flex items-center group focus-within:ring-2 focus-within:ring-neutral-900/5 transition-all">
        <div className="p-3 text-neutral-400 group-focus-within:text-neutral-900 transition-colors">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Search by name, barcode, or QR code..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-neutral-900 placeholder:text-neutral-400 font-medium py-3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Item Details</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Barcode / QR</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Stock</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Price (Buy/Sell)</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-neutral-300" size={40} />
                    <p className="text-xs font-bold text-neutral-400 mt-4 uppercase tracking-widest">Loading Inventory...</p>
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
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
                      <div className="space-y-2">
                        <span className="block font-mono text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2.5 py-1.5 rounded-lg border border-neutral-200/50">
                          B: {item.barcode || 'Not assigned'}
                        </span>
                        <span className="block font-mono text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2.5 py-1.5 rounded-lg border border-neutral-200/50">
                          Q: {item.qrCode || 'Not assigned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className={cn('text-sm font-black', item.quantity <= 5 ? 'text-orange-600' : 'text-neutral-900')}>{item.quantity}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[10px] font-bold text-neutral-400">B: {formatCurrency(item.buyingPrice)}</p>
                      <p className="text-sm font-black text-neutral-900">S: {formatCurrency(item.sellingPrice)}</p>
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
                          onClick={() => openCodeModal(item)}
                          className="p-2.5 text-neutral-400 hover:text-neutral-900 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                          title="Manage Barcode/QR"
                        >
                          <Barcode size={16} />
                        </button>
                        <button
                          onClick={() => openModal(item)}
                          className="p-2.5 text-neutral-400 hover:text-neutral-900 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                          title="Edit Item"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className={cn(
                            'p-2.5 rounded-xl transition-all',
                            canDeleteInventory ? 'text-neutral-400 hover:text-red-600 hover:bg-red-50' : 'text-neutral-200 cursor-not-allowed'
                          )}
                          title={canDeleteInventory ? 'Delete Item' : "You don't have delete access"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">No items found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">Barcode/QR can be left blank and auto-generated.</p>
                </div>
                <button onClick={closeModal} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-neutral-400 hover:text-neutral-900">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Barcode</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300"
                        placeholder="Optional: scan or enter barcode"
                        value={formData.barcode}
                        onChange={(e) => {
                          setIsExistingBarcodeItem(false);
                          setFormData({ ...formData, barcode: e.target.value });
                        }}
                        onBlur={(e) => checkBarcode(e.target.value.trim())}
                      />
                      <button
                        type="button"
                        onClick={() => setIsScanning(!isScanning)}
                        className={cn(
                          'p-3.5 rounded-2xl border transition-all active:scale-95',
                          isScanning ? 'bg-red-50 border-red-200 text-red-600 shadow-inner' : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-white hover:shadow-md'
                        )}
                      >
                        <QrCode size={22} />
                      </button>
                    </div>
                    {isScanning && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 rounded-2xl overflow-hidden border-2 border-dashed border-neutral-200 p-2 bg-neutral-50">
                        <div id="reader" className="rounded-xl overflow-hidden" />
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">QR Code</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300"
                      placeholder="Optional: enter QR value"
                      value={formData.qrCode}
                      onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Item Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-medium placeholder:text-neutral-300"
                      placeholder="Product Name"
                      value={formData.name}
                      disabled={!currentItem && isExistingBarcodeItem}
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
                      onFocus={autoSelectDefaultZero}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Buying Price</label>
                      <input
                        required
                        type="number"
                        className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-black"
                        value={formData.buyingPrice}
                        onFocus={autoSelectDefaultZero}
                        onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Selling Price</label>
                      <input
                        required
                        type="number"
                        className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-900 outline-none transition-all font-black"
                        value={formData.sellingPrice}
                        onFocus={autoSelectDefaultZero}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
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
                  <button type="button" onClick={closeModal} className="px-8 py-3.5 rounded-2xl font-bold text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="bg-neutral-900 text-white px-10 py-3.5 rounded-2xl font-bold hover:bg-neutral-800 hover:shadow-xl hover:shadow-neutral-200 transition-all active:scale-95">
                    {currentItem ? 'Save Changes' : 'Add to Inventory'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCodeModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" onClick={closeCodeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-neutral-100"
            >
              <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Barcode / QR Code Manager</h2>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">{codeItem?.name}</p>
                </div>
                <button onClick={closeCodeModal} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all text-neutral-400 hover:text-neutral-900">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Barcode</label>
                    <input
                      type="text"
                      value={codeForm.barcode}
                      onChange={(e) => setCodeForm((prev) => ({ ...prev, barcode: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">QR Code</label>
                    <input
                      type="text"
                      value={codeForm.qrCode}
                      onChange={(e) => setCodeForm((prev) => ({ ...prev, qrCode: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    disabled={codeBusy}
                    onClick={() => generateCodes(false)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 disabled:opacity-60 flex items-center gap-2"
                  >
                    <WandSparkles size={14} /> Generate Missing
                  </button>
                  <button
                    disabled={codeBusy}
                    onClick={() => generateCodes(true)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    Regenerate Both
                  </button>
                  <button
                    disabled={codeBusy}
                    onClick={saveCodes}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60 flex items-center gap-2"
                  >
                    <Save size={14} /> Save
                  </button>
                  <button
                    disabled={codeBusy}
                    onClick={() => deleteCodes('barcode')}
                    className="px-4 py-2.5 rounded-xl border border-red-200 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Delete Barcode
                  </button>
                  <button
                    disabled={codeBusy}
                    onClick={() => deleteCodes('qrcode')}
                    className="px-4 py-2.5 rounded-xl border border-red-200 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Delete QR
                  </button>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
                  {codeBusy ? (
                    <div className="py-10 flex justify-center">
                      <Loader2 className="animate-spin text-neutral-400" />
                    </div>
                  ) : codePreview ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-neutral-900">{codePreview.itemName}</p>
                          <p className="text-sm font-bold text-neutral-500">Price: {formatCurrency(codePreview.sellingPrice || 0)}</p>
                          <p className="text-xs font-mono text-neutral-500 mt-2">Barcode: {codePreview.barcode || 'Not assigned'}</p>
                        </div>
                        <button
                          onClick={handlePrintLabel}
                          className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 flex items-center gap-2"
                        >
                          <Printer size={14} /> Print Label
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl border border-neutral-200 p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 mb-2">Barcode Preview</p>
                          {codePreview.barcodeImage ? (
                            <img src={codePreview.barcodeImage} alt="Barcode" className="w-full h-auto object-contain" />
                          ) : (
                            <p className="text-sm text-neutral-400">No barcode generated</p>
                          )}
                        </div>
                        <div className="bg-white rounded-xl border border-neutral-200 p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 mb-2">QR Preview</p>
                          {codePreview.qrCodeImage ? (
                            <img src={codePreview.qrCodeImage} alt="QR Code" className="w-full h-auto object-contain max-h-48" />
                          ) : (
                            <p className="text-sm text-neutral-400">No QR code generated</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">Preview not available.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed -left-[9999px] top-0">
        <div
          ref={printLabelRef}
          style={{
            width: '50mm',
            height: '25mm',
            padding: '2mm',
            boxSizing: 'border-box',
            fontFamily: 'Arial, sans-serif',
            border: '1px solid #ddd',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '8pt', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{codePreview?.itemName || ''}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
            <div style={{ flex: 1 }}>
              {codePreview?.barcodeImage ? <img src={codePreview.barcodeImage} alt="Barcode" style={{ width: '100%', height: '9mm', objectFit: 'contain' }} /> : null}
              <div style={{ fontSize: '6pt', textAlign: 'center' }}>{codePreview?.barcode || ''}</div>
            </div>
            {codePreview?.qrCodeImage ? <img src={codePreview.qrCodeImage} alt="QR" style={{ width: '10mm', height: '10mm' }} /> : null}
          </div>
          <div style={{ fontSize: '8pt', fontWeight: 700 }}>Price: {formatCurrency(codePreview?.sellingPrice || 0)}</div>
        </div>
      </div>
    </div>
  );
}
