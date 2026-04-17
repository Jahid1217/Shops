import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Package, 
  Users, 
  AlertCircle,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { api } from '../lib/api';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalItems: 0,
    outOfStock: 0,
    lowStock: 0,
    totalCustomers: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, chartResp, recentResp, topResp] = await Promise.all([
          api.get<any>('/dashboard/stats'),
          api.get<any[]>('/dashboard/chart-data'),
          api.get<any[]>('/dashboard/recent-sales'),
          api.get<any[]>('/dashboard/top-selling')
        ]);

        setStats(statsData);
        setChartData(chartResp);
        setRecentSales(recentResp);
        setTopItems(topResp);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Sales',
      value: formatCurrency(stats.totalSales),
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
      trend: '+12.5%',
      isPositive: true
    },
    {
      title: 'Products in Stock',
      value: stats.totalItems.toString(),
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      trend: '+4.2%',
      isPositive: true
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      trend: '+8.1%',
      isPositive: true
    },
    {
      title: 'Stock Alerts',
      value: (stats.lowStock + stats.outOfStock).toString(),
      icon: AlertCircle,
      color: 'bg-red-50 text-red-600',
      trend: `${stats.outOfStock} out of stock`,
      isPositive: false
    }
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400 mb-4" size={40} />
        <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">Loading Dashboard Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Overview</h1>
        <p className="text-neutral-500 font-medium mt-1">Here's what's happening in your store today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div 
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-[2rem] p-6 border border-neutral-200/60 shadow-sm hover:shadow-xl hover:shadow-neutral-200/50 hover:-translate-y-1 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3", card.color)}>
                <card.icon size={26} strokeWidth={2} />
              </div>
              <span className={cn(
                "text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full",
                card.isPositive ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
              )}>
                {card.trend}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1">{card.title}</p>
              <h3 className="text-3xl font-black text-neutral-900 tracking-tight">{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="xl:col-span-2 bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm p-8"
        >
          <div className="flex items-center justify-between mb-8">
             <div>
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Revenue Overview</h2>
                <p className="text-xs font-medium text-neutral-400 mt-1">Daily sales performance for the last 7 days</p>
             </div>
             <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center shadow-lg shadow-neutral-200">
                <TrendingUp size={18} className="text-white" />
             </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#171717" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#171717" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#a3a3a3', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#a3a3a3', fontWeight: 600 }}
                  tickFormatter={(val) => `৳${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                  itemStyle={{ color: '#171717' }}
                  formatter={(value: number) => [`৳${value}`, 'Sales']}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#171717" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Info Column */}
        <div className="space-y-8">
          {/* Top Selling Items */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm p-6"
          >
             <h2 className="text-sm font-black uppercase tracking-widest text-neutral-900 mb-6 flex items-center gap-2">
                <ShoppingCart size={16} className="text-neutral-400" /> Top Selling
             </h2>
             <div className="space-y-4">
               {topItems.length > 0 ? topItems.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-4 bg-neutral-50/50 p-3 rounded-2xl border border-neutral-100 hover:border-neutral-200 transition-colors">
                     <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-neutral-100 flex items-center justify-center text-xs font-black text-neutral-400">
                        #{i + 1}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 truncate">{item.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-0.5">{item.count} items sold</p>
                     </div>
                  </div>
               )) : (
                 <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest text-center py-4">No data available</p>
               )}
             </div>
          </motion.div>

          {/* Recent Sales List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-[2rem] border border-neutral-200/60 shadow-sm p-6"
          >
             <h2 className="text-sm font-black uppercase tracking-widest text-neutral-900 mb-6 flex items-center gap-2">
                <CreditCard size={16} className="text-neutral-400" /> Recent Sales
             </h2>
             <div className="space-y-4">
               {recentSales.length > 0 ? recentSales.slice(0, 4).map((sale) => (
                 <div key={sale.id} className="flex justify-between items-center bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                    <div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 bg-white px-2 py-1 rounded-md border border-neutral-200/60 inline-block mb-1.5 shadow-sm">
                          {sale.paymentMethod}
                       </span>
                       <p className="text-xs font-bold text-neutral-500">
                          {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                    <span className="text-lg font-black text-neutral-900">{formatCurrency(sale.totalPrice)}</span>
                 </div>
               )) : (
                 <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest text-center py-4">No recent sales</p>
               )}
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
