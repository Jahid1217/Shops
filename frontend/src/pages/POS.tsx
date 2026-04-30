import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Receipt,
  QrCode,
  X,
  UserPlus,
  ArrowLeft
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useReactToPrint } from 'react-to-print';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { formatCurrency, calculateDiscount, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const MOBILE_METHODS_STORAGE_KEY = 'stockmaster_mobile_methods';
const DEFAULT_MOBILE_METHODS = ['bKash', 'Nagad', 'Upay', 'Other'];

export default function POS() {
  const { profile, hasFeature } = useAuth();
  const canCheckout = hasFeature('pos.checkout');
  const [items, setItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  // Checkout State
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile'>('Cash');
  const [cashReceived, setCashReceived] = useState(0);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [cardCodeType, setCardCodeType] = useState<'Visa' | 'MasterCard' | 'Amex' | 'Other'>('Visa');
  const [cardLast4, setCardLast4] = useState('');
  const [mobilePaymentMethod, setMobilePaymentMethod] = useState('');
  const [mobileLast4, setMobileLast4] = useState('');
  const [mobilePaymentMethods, setMobilePaymentMethods] = useState<string[]>(() => {
    const saved = localStorage.getItem(MOBILE_METHODS_STORAGE_KEY);
    if (!saved) return DEFAULT_MOBILE_METHODS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((entry) => typeof entry === 'string' && entry.trim().length > 0);
      }
      return DEFAULT_MOBILE_METHODS;
    } catch {
      return DEFAULT_MOBILE_METHODS;
    }
  });
  const [newMobileMethod, setNewMobileMethod] = useState('');
  
  // Modals
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string>('');
  const [lastSaleMeta, setLastSaleMeta] = useState<{
    paymentMethod: 'Cash' | 'Card' | 'Mobile';
    cardCodeType: string | null;
    cardLast4: string | null;
    mobilePaymentMethod: string | null;
    mobileLast4: string | null;
    customerPhone: string | null;
    customerName: string | null;
    cashReceived: number;
    cashReturn: number;
  } | null>(null);
  
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    localStorage.setItem(MOBILE_METHODS_STORAGE_KEY, JSON.stringify(mobilePaymentMethods));
  }, [mobilePaymentMethods]);

  const fetchItems = async () => {
    try {
      const data = await api.get<any[]>('/items');
      setItems(data.filter(item => item.quantity > 0)); // Only show in-stock items
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const normalizeLast4 = (value: string) => value.replace(/\D/g, '').slice(0, 4);

  const resetSaleSession = () => {
    setShowReceipt(false);
    setIsCheckoutModalOpen(false);
    setCart([]);
    setCashReceived(0);
    setCustomerPhone('');
    setCustomerInfo(null);
    setPaymentMethod('Cash');
    setCardCodeType('Visa');
    setCardLast4('');
    setMobilePaymentMethod('');
    setMobileLast4('');
    setLastSaleMeta(null);
  };

  const handleBackFromReceipt = () => {
    setShowReceipt(false);
    setIsCheckoutModalOpen(true);
  };

  const addMobilePaymentMethod = () => {
    const value = newMobileMethod.trim();
    if (!value) return;
    if (mobilePaymentMethods.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
      alert('This mobile payment method already exists.');
      return;
    }
    setMobilePaymentMethods((prev) => [...prev, value]);
    setNewMobileMethod('');
  };

  const removeMobilePaymentMethod = (name: string) => {
    if (mobilePaymentMethods.length <= 1) {
      alert('At least one mobile payment method is required.');
      return;
    }
    setMobilePaymentMethods((prev) => prev.filter((entry) => entry !== name));
    if (mobilePaymentMethod === name) {
      setMobilePaymentMethod('');
    }
  };

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner("pos-reader", { fps: 10, qrbox: 250 }, false);
      scanner.render(onScanSuccess, onScanError);
      return () => scanner.clear();
    }
  }, [isScanning]);

  const onScanSuccess = (decodedText: string) => {
    setIsScanning(false);
    handleBarcodeSearch(decodedText);
  };

  const onScanError = (err: any) => {};

  const handleBarcodeSearch = async (barcode: string) => {
    try {
      const result = await api.get<any>(`/items/barcode/${barcode}`);
      if (result && !result.found === false && result.quantity > 0) {
        addToCart(result);
        setSearch(''); // clear search after adding
      } else {
        alert('Item not found or out of stock');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search) return;
    handleBarcodeSearch(search);
  };

  const fetchCustomerInfo = async (phone: string) => {
    if (!phone || phone.length < 11) {
      setCustomerInfo(null);
      return;
    }
    try {
      const customer = await api.get<any>(`/customers/phone/${phone}`);
      if (customer && !customer.found === false) {
        setCustomerInfo(customer);
      } else {
        setCustomerInfo(null);
      }
    } catch (error) {
      setCustomerInfo(null);
    }
  };

  const handleCustomerPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setCustomerPhone(phone);
    fetchCustomerInfo(phone);
  };

  const addToCart = (item: any) => {
    const existing = cart.find(cartItem => cartItem.item.id === item.id);
    if (existing) {
      if (existing.qty < item.quantity) {
        setCart(cart.map(cartItem => 
          cartItem.item.id === item.id 
            ? { ...cartItem, qty: cartItem.qty + 1 } 
            : cartItem
        ));
      } else {
        alert(`Maximum available quantity is ${item.quantity}`);
      }
    } else {
      setCart([...cart, { item, qty: 1 }]);
    }
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart(cart.map(cartItem => {
      if (cartItem.item.id === itemId) {
        const newQty = cartItem.qty + delta;
        if (newQty > 0 && newQty <= cartItem.item.quantity) {
          return { ...cartItem, qty: newQty };
        }
      }
      return cartItem;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(cartItem => cartItem.item.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, { item, qty }) => {
    const itemTotal = calculateDiscount(item.sellingPrice, item.discountType, item.discountValue) * qty;
    return sum + itemTotal;
  }, 0);

  const cartSubtotal = cart.reduce((sum, { item, qty }) => sum + (item.sellingPrice * qty), 0);
  const totalDiscount = cartSubtotal - cartTotal;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const normalizedCardLast4 = normalizeLast4(cardLast4);
    const normalizedMobileLast4 = normalizeLast4(mobileLast4);

    if (cardLast4 && normalizedCardLast4.length !== 4) {
      alert('Card code must be exactly 4 digits.');
      return;
    }

    if (mobileLast4 && normalizedMobileLast4.length !== 4) {
      alert('Mobile number must be exactly 4 digits.');
      return;
    }

    if (paymentMethod === 'Mobile' && !mobilePaymentMethod) {
      alert('Please select a mobile payment option.');
      return;
    }
    
    // Check stock one last time (optimistic - backend will also verify later if implemented)
    // Here we just rely on API for final checkout logic

    const cashReturn = paymentMethod === 'Cash' ? Math.max(0, cashReceived - cartTotal) : 0;
    
    const checkoutData = {
      items: cart.map(c => ({
        id: c.item.id,
        name: c.item.name,
        qty: c.qty,
        price: calculateDiscount(c.item.sellingPrice, c.item.discountType, c.item.discountValue)
      })),
      totalPrice: cartTotal,
      discount: totalDiscount,
      paymentMethod,
      cardCodeType: paymentMethod === 'Card' ? cardCodeType : null,
      cardLast4: paymentMethod === 'Card' ? (normalizedCardLast4 || null) : null,
      mobilePaymentMethod: paymentMethod === 'Mobile' ? mobilePaymentMethod : null,
      mobileLast4: paymentMethod === 'Mobile' ? (normalizedMobileLast4 || null) : null,
      cashReceived: paymentMethod === 'Cash' ? cashReceived : cartTotal,
      cashReturn,
      customerPhone,
    };

    try {
      const response = await api.post<any>('/sales/checkout', checkoutData);
      setLastSaleId(response.id.toString().padStart(6, '0'));
      setLastSaleMeta({
        paymentMethod,
        cardCodeType: paymentMethod === 'Card' ? cardCodeType : null,
        cardLast4: paymentMethod === 'Card' ? (normalizedCardLast4 || null) : null,
        mobilePaymentMethod: paymentMethod === 'Mobile' ? mobilePaymentMethod : null,
        mobileLast4: paymentMethod === 'Mobile' ? (normalizedMobileLast4 || null) : null,
        customerPhone: customerPhone || null,
        customerName: customerInfo?.name || null,
        cashReceived: paymentMethod === 'Cash' ? cashReceived : cartTotal,
        cashReturn,
      });
      setIsCheckoutModalOpen(false);
      setShowReceipt(true);
      fetchItems(); // refresh inventory
    } catch (error) {
      console.error("Checkout failed:", error);
      alert('Checkout failed. Please try again.');
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: () => `Invoice-${lastSaleId || new Date().toISOString().slice(0, 10)}`,
    onPrintError: () => {
      alert('Failed to open print dialog. Please try again.');
    },
    onAfterPrint: () => {
      resetSaleSession();
    }
  });

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.barcode || '').includes(search)
  ).slice(0, 12); // limit to 12 items on POS screen for performance

  return (
    <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
      {/* Left side - Products */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <div className="flex-1 bg-white rounded-2xl border border-neutral-200/60 shadow-sm flex items-center group focus-within:ring-2 focus-within:ring-neutral-900/5 transition-all">
              <div className="p-3.5 text-neutral-400 group-focus-within:text-neutral-900 transition-colors">
                <Search size={22} />
              </div>
              <input 
                type="text" 
                placeholder="Scan barcode or search products..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-neutral-900 placeholder:text-neutral-400 font-medium py-3.5"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <button 
              type="button"
              onClick={() => setIsScanning(!isScanning)}
              className={cn(
                "px-5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center",
                isScanning 
                  ? "bg-red-50 border-red-200 text-red-600 shadow-inner" 
                  : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:shadow-md"
              )}
            >
              <QrCode size={22} />
            </button>
          </form>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 rounded-2xl overflow-hidden border-2 border-dashed border-neutral-200 p-2 bg-neutral-50 max-h-64"
            >
              <div id="pos-reader" className="rounded-xl overflow-hidden h-full" />
            </motion.div>
          )}
        </div>

        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const discountedPrice = calculateDiscount(item.sellingPrice, item.discountType, item.discountValue);
              
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="group relative bg-white border border-neutral-200/80 rounded-[1.5rem] p-5 text-left hover:border-neutral-900 hover:shadow-xl hover:shadow-neutral-200 hover:-translate-y-1 transition-all active:scale-[0.98]"
                >
                  <div className="mb-4">
                    <span className="inline-block px-2.5 py-1 bg-neutral-100 text-neutral-500 text-[9px] font-black uppercase tracking-widest rounded-lg mb-3 border border-neutral-200/50">
                      {item.barcode}
                    </span>
                    <h3 className="font-bold text-neutral-900 leading-tight group-hover:text-black transition-colors line-clamp-2">{item.name}</h3>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight mt-1">{item.quantity} in stock</p>
                  </div>
                  <div>
                    {item.discountValue > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-green-600">{formatCurrency(discountedPrice)}</span>
                        <span className="text-xs font-bold text-neutral-400 line-through decoration-neutral-300">{formatCurrency(item.sellingPrice)}</span>
                      </div>
                    ) : (
                      <span className="text-lg font-black text-neutral-900">{formatCurrency(item.sellingPrice)}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right side - Cart & Checkout */}
      <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm overflow-hidden flex-shrink-0">
        <div className="p-6 border-b border-neutral-100 bg-neutral-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <ShoppingCart size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Current Sale</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-0.5">{cart.length} Items in Cart</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-neutral-50/30">
          <AnimatePresence>
            {cart.map((cartItem) => {
              const discountedPrice = calculateDiscount(cartItem.item.sellingPrice, cartItem.item.discountType, cartItem.item.discountValue);
              
              return (
                <motion.div 
                  key={cartItem.item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white border border-neutral-200/80 rounded-2xl p-4 mb-3 flex items-center gap-4 hover:border-neutral-300 hover:shadow-md transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-neutral-900 truncate">{cartItem.item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-black text-neutral-900">{formatCurrency(discountedPrice)}</span>
                      {cartItem.item.discountValue > 0 && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">Sale</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-neutral-50 rounded-xl border border-neutral-200/80 p-1">
                    <button 
                      onClick={() => updateCartQty(cartItem.item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:bg-white hover:text-neutral-900 hover:shadow-sm rounded-lg transition-all"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-neutral-900">
                      {cartItem.qty}
                    </span>
                    <button 
                      onClick={() => updateCartQty(cartItem.item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:bg-white hover:text-neutral-900 hover:shadow-sm rounded-lg transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(cartItem.item.id)}
                    className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-4 opacity-50">
              <ShoppingCart size={48} strokeWidth={1} />
              <p className="text-sm font-bold uppercase tracking-widest text-center max-w-[200px]">Scan or add items to begin</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-neutral-100">
          <div className="space-y-3 mb-6 bg-neutral-50 p-5 rounded-[1.5rem] border border-neutral-200/50">
            <div className="flex justify-between text-sm">
              <span className="font-bold text-neutral-500">Subtotal</span>
              <span className="font-bold text-neutral-900">{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-bold text-neutral-500">Discount</span>
              <span className="font-bold text-green-600">-{formatCurrency(totalDiscount)}</span>
            </div>
            <div className="h-px bg-neutral-200/60 my-2" />
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Total</span>
              <span className="text-3xl font-black text-neutral-900 tracking-tight">{formatCurrency(cartTotal)}</span>
            </div>
          </div>
          
          <button 
            disabled={cart.length === 0 || !canCheckout}
            onClick={() => setIsCheckoutModalOpen(true)}
            className="w-full bg-neutral-900 text-white py-4.5 rounded-[1.25rem] font-bold text-lg flex items-center justify-center hover:bg-neutral-800 hover:shadow-xl hover:shadow-neutral-300 transition-all disabled:opacity-50 disabled:hover:shadow-none active:scale-[0.98]"
          >
            <Banknote size={24} className="mr-3" />
            Checkout Now
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
              onClick={() => setIsCheckoutModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Checkout</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 mt-1">Complete Sale</p>
                </div>
                <button onClick={() => setIsCheckoutModalOpen(false)} className="p-2.5 hover:bg-white hover:shadow-sm shadow-neutral-200 rounded-xl transition-all text-neutral-400 hover:text-neutral-900 border border-transparent hover:border-neutral-200">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="bg-neutral-900 text-white p-6 rounded-[1.5rem] shadow-lg shadow-neutral-200 flex justify-between items-center transform transition-transform hover:scale-[1.02]">
                  <span className="text-sm font-bold opacity-80 uppercase tracking-widest text-[10px]">Total Amount</span>
                  <span className="text-4xl font-black tracking-tight">{formatCurrency(cartTotal)}</span>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Cash', 'Card', 'Mobile'].map((method) => (
                      <button
                        key={method}
                        onClick={() => {
                          setPaymentMethod(method as any);
                          if (method !== 'Card') {
                            setCardLast4('');
                          }
                          if (method !== 'Mobile') {
                            setMobilePaymentMethod('');
                            setMobileLast4('');
                          }
                        }}
                        className={cn(
                          "py-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all font-bold active:scale-95",
                          paymentMethod === method 
                            ? "border-neutral-900 bg-neutral-900 text-white shadow-lg shadow-neutral-200" 
                            : "border-neutral-100 bg-white text-neutral-500 hover:border-neutral-200 hover:bg-neutral-50"
                        )}
                      >
                        {method === 'Cash' ? <Banknote size={24} /> : method === 'Card' ? <CreditCard size={24} /> : <QrCode size={24} />}
                        <span className="text-xs uppercase tracking-widest">{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1 flex items-center gap-2">
                    Customer Link <UserPlus size={14} className="text-neutral-400" />
                  </label>
                  <div className="relative group">
                    <input 
                      type="tel"
                      placeholder="Enter mobile number"
                      className="w-full px-5 py-4 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 outline-none transition-all font-bold text-neutral-900 placeholder:text-neutral-300 placeholder:font-medium bg-neutral-50/50 group-hover:bg-white"
                      value={customerPhone}
                      onChange={handleCustomerPhoneChange}
                    />
                    {customerInfo && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-50 text-green-700 px-3 py-1.5 rounded-xl border border-green-100 text-xs font-bold flex items-center gap-2 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        {customerInfo.name} ({customerInfo.points} pts)
                      </div>
                    )}
                  </div>
                </div>

                {paymentMethod === 'Card' && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Card Code (Optional)</label>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 outline-none transition-all font-bold appearance-none bg-white"
                          value={cardCodeType}
                          onChange={(e) => setCardCodeType(e.target.value as 'Visa' | 'MasterCard' | 'Amex' | 'Other')}
                        >
                          <option value="Visa">Visa</option>
                          <option value="MasterCard">MasterCard</option>
                          <option value="Amex">Amex</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Last 4 of 16-digit code"
                          className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 outline-none transition-all font-black tracking-[0.2em]"
                          value={cardLast4}
                          maxLength={4}
                          onChange={(e) => setCardLast4(normalizeLast4(e.target.value))}
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {paymentMethod === 'Mobile' && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">
                          Mobile Payment Option (Required)
                        </label>
                        <select
                          className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 outline-none transition-all font-bold appearance-none bg-white"
                          value={mobilePaymentMethod}
                          onChange={(e) => setMobilePaymentMethod(e.target.value)}
                        >
                          <option value="">Select payment option</option>
                          {mobilePaymentMethods.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">
                          Last 4 Digits of 11-digit Mobile Number (Optional)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="e.g. 1234"
                          className="w-full px-4 py-3.5 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 outline-none transition-all font-black tracking-[0.2em]"
                          value={mobileLast4}
                          maxLength={4}
                          onChange={(e) => setMobileLast4(normalizeLast4(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2 border border-neutral-200 rounded-2xl p-4 bg-neutral-50/50">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">
                          Configure Mobile Methods
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add method name"
                            value={newMobileMethod}
                            onChange={(e) => setNewMobileMethod(e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 outline-none transition-all font-medium bg-white"
                          />
                          <button
                            type="button"
                            onClick={addMobilePaymentMethod}
                            className="px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 flex items-center gap-1"
                          >
                            <Plus size={14} /> Add New
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {mobilePaymentMethods.map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => removeMobilePaymentMethod(method)}
                              className="px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs font-bold text-neutral-600 hover:text-red-600 hover:border-red-200"
                              title="Remove method"
                            >
                              {method} ×
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {paymentMethod === 'Cash' && (
                  <AnimatePresence>
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 ml-1">Cash Received</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-lg">৳</span>
                        <input 
                          type="number"
                          className="w-full pl-10 pr-5 py-4 rounded-2xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 outline-none transition-all font-black text-xl text-neutral-900 bg-neutral-50/50 focus:bg-white"
                          value={cashReceived || ''}
                          onChange={(e) => setCashReceived(Number(e.target.value))}
                        />
                      </div>
                      <div className="pt-2 flex justify-end items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Change Due</span>
                        <span className={cn(
                          "text-xl font-black",
                          cashReceived >= cartTotal ? "text-green-600" : "text-red-500"
                        )}>
                          {formatCurrency(Math.max(0, cashReceived - cartTotal))}
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              <div className="p-8 border-t border-neutral-100 bg-neutral-50/50 shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="w-full bg-white text-neutral-900 py-4.5 rounded-[1.25rem] font-bold text-lg border border-neutral-200 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={
                      !canCheckout ||
                      (paymentMethod === 'Cash' && cashReceived < cartTotal) ||
                      (paymentMethod === 'Mobile' && !mobilePaymentMethod)
                    }
                    className="w-full bg-neutral-900 text-white py-4.5 rounded-[1.25rem] font-bold text-lg flex items-center justify-center hover:bg-neutral-800 hover:shadow-xl hover:shadow-neutral-300 transition-all disabled:opacity-50 disabled:hover:shadow-none active:scale-[0.98]"
                  >
                    Finalize Sale
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
              onClick={resetSaleSession}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm flex flex-col items-center"
            >
              {/* Receipt Content */}
              <div ref={receiptRef} className="w-full bg-white rounded-t-3xl rounded-b-xl shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-neutral-900" />
                
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden shrink-0">
                     <Receipt className="text-white shrink-0" size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-black text-2xl text-neutral-900 tracking-tight">{profile?.shopName || 'StockMaster'}</h3>
                  <p className="text-xs font-bold text-neutral-400 mt-1 uppercase tracking-widest">Official Receipt</p>
                </div>

                <div className="space-y-2 mb-6 text-xs text-neutral-500 font-medium">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-bold text-neutral-900">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Receipt No:</span>
                    <span className="font-bold text-neutral-900 font-mono">#{lastSaleId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span className="font-bold text-neutral-900">{profile?.username}</span>
                  </div>
                  {lastSaleMeta?.customerPhone && (
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="font-bold text-neutral-900">{lastSaleMeta.customerName || lastSaleMeta.customerPhone}</span>
                    </div>
                  )}
                  {lastSaleMeta?.paymentMethod && (
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <span className="font-bold text-neutral-900">
                        {lastSaleMeta.paymentMethod}
                        {lastSaleMeta.paymentMethod === 'Mobile' && lastSaleMeta.mobilePaymentMethod ? ` (${lastSaleMeta.mobilePaymentMethod})` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-dashed border-neutral-200 py-4 mb-4">
                  <div className="grid grid-cols-12 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 mb-3">
                    <div className="col-span-6">Item</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-4 text-right">Price</div>
                  </div>
                  <div className="space-y-3">
                    {cart.map((cartItem) => {
                       const discountedPrice = calculateDiscount(cartItem.item.sellingPrice, cartItem.item.discountType, cartItem.item.discountValue);
                       return (
                         <div key={cartItem.item.id} className="grid grid-cols-12 text-sm font-bold text-neutral-900 items-start">
                           <div className="col-span-6 pr-2 leading-tight">{cartItem.item.name}</div>
                           <div className="col-span-2 text-center text-neutral-500">{cartItem.qty}</div>
                           <div className="col-span-4 text-right">{formatCurrency(discountedPrice * cartItem.qty)}</div>
                         </div>
                       )
                    })}
                  </div>
                </div>

                <div className="space-y-2 text-sm font-bold text-neutral-500 mb-6 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(totalDiscount)}</span>
                  </div>
                  <div className="h-px bg-neutral-200/60 my-2" />
                  <div className="flex justify-between text-lg font-black text-neutral-900">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                {lastSaleMeta?.paymentMethod === 'Cash' && (
                  <div className="space-y-1 text-xs font-bold text-neutral-500 text-center mb-6">
                    <div className="flex justify-between bg-white px-2">
                       <span>Cash Received:</span>
                       <span className="text-neutral-900">{formatCurrency(lastSaleMeta.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between bg-white px-2">
                       <span>Change Returned:</span>
                       <span className="text-neutral-900">{formatCurrency(lastSaleMeta.cashReturn)}</span>
                    </div>
                  </div>
                )}

                {lastSaleMeta?.paymentMethod === 'Card' && (lastSaleMeta.cardLast4 || lastSaleMeta.cardCodeType) && (
                  <div className="space-y-1 text-xs font-bold text-neutral-500 text-center mb-6">
                    <div className="flex justify-between bg-white px-2">
                      <span>Card:</span>
                      <span className="text-neutral-900">{lastSaleMeta.cardCodeType || 'Card'}</span>
                    </div>
                    {lastSaleMeta.cardLast4 && (
                      <div className="flex justify-between bg-white px-2">
                        <span>Code Last 4:</span>
                        <span className="text-neutral-900">{lastSaleMeta.cardLast4}</span>
                      </div>
                    )}
                  </div>
                )}

                {lastSaleMeta?.paymentMethod === 'Mobile' && (lastSaleMeta.mobilePaymentMethod || lastSaleMeta.mobileLast4) && (
                  <div className="space-y-1 text-xs font-bold text-neutral-500 text-center mb-6">
                    {lastSaleMeta.mobilePaymentMethod && (
                      <div className="flex justify-between bg-white px-2">
                        <span>Mobile Method:</span>
                        <span className="text-neutral-900">{lastSaleMeta.mobilePaymentMethod}</span>
                      </div>
                    )}
                    {lastSaleMeta.mobileLast4 && (
                      <div className="flex justify-between bg-white px-2">
                        <span>Mobile Last 4:</span>
                        <span className="text-neutral-900">{lastSaleMeta.mobileLast4}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-neutral-900 uppercase tracking-widest mb-1">
                     Thank You!
                  </div>
                  <p className="text-[10px] font-bold text-neutral-400">Please visit again</p>
                </div>
                
                {/* Zigzag bottom border effect */}
                <div className="absolute -bottom-2 left-0 w-full h-4 bg-transparent receipt-edge"></div>
              </div>

              {/* Actions */}
              <div className="w-full mt-6 grid grid-cols-2 gap-3 z-10">
                <button
                  onClick={handleBackFromReceipt}
                  className="py-4 rounded-2xl font-bold bg-white text-neutral-900 hover:bg-neutral-50 transition-all border border-neutral-200/60 shadow-lg flex justify-center items-center gap-2"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button 
                  onClick={resetSaleSession}
                  className="py-4 rounded-2xl font-bold bg-white text-neutral-900 hover:bg-neutral-50 transition-all border border-neutral-200/60 shadow-lg flex justify-center items-center gap-2"
                >
                  <X size={18} /> Close
                </button>
                <button
                  onClick={resetSaleSession}
                  className="py-4 rounded-2xl font-bold bg-neutral-100 text-neutral-900 hover:bg-neutral-200 transition-all border border-neutral-200/60 shadow-lg flex justify-center items-center gap-2"
                >
                  <Plus size={18} /> Add New
                </button>
                <button 
                  onClick={handlePrint}
                  className="py-4 rounded-2xl font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-900/20 flex justify-center items-center gap-2"
                >
                  <Receipt size={18} /> Print 
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
