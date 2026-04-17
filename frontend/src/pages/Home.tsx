import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Package, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      title: 'Inventory Tracking',
      description: 'Real-time stock management with low-stock alerts and expiration tracking.',
      icon: Package,
    },
    {
      title: 'Smart POS System',
      description: 'Fast checkout with barcode/QR scanning and multiple payment options.',
      icon: Zap,
    },
    {
      title: 'Advanced Analytics',
      description: 'Detailed reports on sales, best-selling items, and business growth.',
      icon: BarChart3,
    },
    {
      title: 'Employee Control',
      description: 'Manage staff permissions and track their sales performance securely.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center">
            <Package className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">StockMaster Pro</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">Login</Link>
          <Link to="/register" className="bg-neutral-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.9] mb-8">
              Manage your shop <br />
              <span className="text-neutral-400 italic font-serif">with precision.</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-10 max-w-lg leading-relaxed">
              The all-in-one inventory and POS system designed for modern businesses. 
              Track items, manage sales, and grow your shop with data-driven insights.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/register" className="bg-neutral-900 text-white px-8 py-4 rounded-full font-medium flex items-center justify-center group">
                Start Free Trial
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
              <Link to="/login" className="border border-neutral-200 px-8 py-4 rounded-full font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center">
                View Demo
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-square bg-neutral-100 rounded-3xl overflow-hidden shadow-2xl border border-neutral-200">
              <img 
                src="https://picsum.photos/seed/inventory/1200/1200" 
                alt="Dashboard Preview" 
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            {/* Floating Stats */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-neutral-100 max-w-[200px]">
              <p className="text-sm text-neutral-500 mb-1">Total Sales Today</p>
              <p className="text-2xl font-bold">৳ 45,230</p>
              <div className="mt-2 flex items-center text-green-600 text-xs font-medium">
                <CheckCircle2 size={14} className="mr-1" />
                +12% from yesterday
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-neutral-50 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold mb-4">Everything you need to scale</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Built for retailers who want to spend less time on spreadsheets and more time growing their business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm"
              >
                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="text-neutral-900" size={24} />
                </div>
                <h3 className="font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
