import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon,
  Search,
  ShoppingCart,
  Download,
  Calendar,
  Loader2,
  Package
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { api } from '../lib/api';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function History() {
  const [sales, setSales] = useState<any[]>([]);
  const [inventoryHistory, setInventoryHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory'>('sales');

  const fetchData = async () => {
    try {
      if (activeTab === 'sales') {
        const data = await api.get<any[]>('/sales');
        setSales(data);
      } else {
        const data = await api.get<any[]>('/inventory-history');
        setInventoryHistory(data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [activeTab]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    if (activeTab === 'sales') {
      doc.text('Sales History Report', 14, 15);
      
      const tableData = filteredSales.map(sale => [
        new Date(sale.timestamp).toLocaleDateString(),
        sale.id.toString(),
        sale.items.reduce((sum: number, item: any) => sum + item.qty, 0).toString(),
        formatCurrency(sale.totalPrice),
        sale.paymentMethod,
        sale.employeeName || 'Unknown'
      ]);

      (doc as any).autoTable({
        head: [['Date', 'Receipt No', 'Items', 'Total', 'Payment', 'Cashier']],
        body: tableData,
        startY: 25,
      });
    } else {
      doc.text('Inventory History Report', 14, 15);
      
      const tableData = filteredInventory.map(record => [
        new Date(record.timestamp).toLocaleString(),
        record.itemName,
        record.type.toUpperCase(),
        record.quantity.toString(),
        record.performedBy || 'System'
      ]);

      (doc as any).autoTable({
        head: [['Date & Time', 'Item', 'Action', 'Qty Change', 'User']],
        body: tableData,
        startY: 25,
      });
    }

    doc.save(`${activeTab}-history-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportExcel = () => {
    let ws;
    if (activeTab === 'sales') {
      const data = filteredSales.map(sale => ({
        Date: new Date(sale.timestamp).toLocaleDateString(),
        'Receipt No': sale.id,
        'Total Items': sale.items.reduce((sum: number, item: any) => sum + item.qty, 0),
        'Total Amount': sale.totalPrice,
        'Payment Method': sale.paymentMethod,
        Cashier: sale.employeeName
      }));
      ws = XLSX.utils.json_to_sheet(data);
    } else {
      const data = filteredInventory.map(record => ({
        DateTime: new Date(record.timestamp).toLocaleString(),
        ItemName: record.itemName,
        Action: record.type,
        Quantity: record.quantity,
        User: record.performedBy
      }));
      ws = XLSX.utils.json_to_sheet(data);
    }
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab === 'sales' ? 'Sales' : 'Inventory');
    XLSX.writeFile(wb, `${activeTab}-history-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredSales = sales.filter(s => 
    s.id.toString().includes(search) ||
    (s.employeeName && s.employeeName.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredInventory = inventoryHistory.filter(i => 
    i.itemName.toLowerCase().includes(search.toLowerCase()) ||
    i.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">History & Reports</h1>
          <p className="text-neutral-500 font-medium mt-1">View transaction logs and inventory movements.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExportPDF}
            className="px-6 py-3.5 bg-white border border-neutral-200/60 rounded-2xl text-sm font-bold text-neutral-900 flex items-center justify-center hover:bg-neutral-50 hover:shadow-sm transition-all"
          >
            <Download size={18} className="mr-2 text-neutral-400" /> Export PDF
          </button>
          <button 
            onClick={handleExportExcel}
            className="px-6 py-3.5 bg-green-50 text-green-700 border border-green-200/60 rounded-2xl text-sm font-bold flex items-center justify-center hover:bg-green-100 hover:shadow-sm transition-all"
          >
            <Download size={18} className="mr-2 text-green-600" /> Export Excel
          </button>
        </div>
      </header>

      {/* Tabs & Search */}
      <div className="bg-white p-2 rounded-[1.5rem] border border-neutral-200/60 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex bg-neutral-100/50 p-1 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('sales')}
            className={cn(
              "flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm",
              activeTab === 'sales' 
                ? "bg-white text-neutral-900" 
                : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50 shadow-none border border-transparent"
            )}
          >
            <ShoppingCart size={16} className="inline-block mr-2" /> Sales
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={cn(
              "flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm",
              activeTab === 'inventory' 
                ? "bg-white text-neutral-900" 
                : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50 shadow-none border border-transparent"
            )}
          >
            <Package size={16} className="inline-block mr-2" /> Inventory
          </button>
        </div>
        
        <div className="flex-1 flex items-center px-4 bg-neutral-50/50 border border-neutral-200/50 rounded-2xl group focus-within:bg-white focus-within:border-neutral-300 transition-colors">
          <Search size={20} className="text-neutral-400 group-focus-within:text-neutral-900 transition-colors" />
          <input 
            type="text" 
            placeholder={activeTab === 'sales' ? "Search receipt number or cashier..." : "Search item name or action..."}
            className="flex-1 bg-transparent border-none focus:ring-0 text-neutral-900 placeholder:text-neutral-400 font-medium py-3 px-3 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-neutral-400">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p className="text-sm font-bold uppercase tracking-widest">Loading Records...</p>
        </div>
      ) : activeTab === 'sales' ? (
        <div className="space-y-4">
          {filteredSales.map((sale, i) => (
            <motion.div 
              key={sale.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-neutral-200/60 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-neutral-200/50 hover:border-neutral-300 transition-all cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 pb-6 border-b border-neutral-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-neutral-900 text-white rounded-[1.25rem] flex flex-col items-center justify-center font-black leading-none shadow-lg shadow-neutral-200">
                    <span className="text-[10px] uppercase tracking-widest opacity-80 mb-0.5">No.</span>
                    <span>{sale.id}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-lg flex items-center gap-2">
                      <Calendar size={16} className="text-neutral-400" />
                      {new Date(sale.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">
                      {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • By {sale.employeeName}
                    </p>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between bg-neutral-50 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 md:mb-1">Total Paid</span>
                  <span className="text-2xl font-black text-neutral-900 tracking-tight">{formatCurrency(sale.totalPrice)}</span>
                  <span className="mt-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-100 rounded-lg">
                    {sale.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sale.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center p-3 bg-neutral-50/50 border border-neutral-100 rounded-2xl">
                    <div className="w-10 h-10 bg-white border border-neutral-200 shadow-sm rounded-xl flex items-center justify-center text-xs font-black text-neutral-400 mr-3 shrink-0">
                      {item.qty}x
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 truncate">{item.name}</p>
                      <p className="text-xs font-bold text-neutral-500 mt-0.5">{formatCurrency(item.price * item.qty)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
          {filteredSales.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-neutral-300" />
              </div>
              <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">No sales records found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Date & Time</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Item</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Action</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">Quantity</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filteredInventory.map((record, i) => (
                  <motion.tr 
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <p className="font-bold text-neutral-900">{new Date(record.timestamp).toLocaleDateString()}</p>
                      <p className="text-xs font-bold text-neutral-400 mt-0.5">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-bold text-neutral-900">{record.itemName}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        record.type.toLowerCase() === 'restock' || record.type.toLowerCase() === 'new_item'
                          ? "bg-green-50 text-green-600 border-green-100" 
                          : "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        {record.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-black text-neutral-900">{record.quantity > 0 ? `+${record.quantity}` : record.quantity}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-bold text-neutral-500">{record.performedBy}</span>
                    </td>
                  </motion.tr>
                ))}
                {filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">No inventory history found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
