import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ReportFilters = {
  startDate: string;
  endDate: string;
  product: string;
  category: string;
  status: string;
  paymentMethod: string;
  groupBy: string;
  search: string;
};

type Props = {
  reportType: string;
  filters: ReportFilters;
  onChange: (next: ReportFilters) => void;
  onApply: () => void;
  onReset: () => void;
};

const groupByOptions: Record<string, Array<{ value: string; label: string }>> = {
  stock: [
    { value: 'status', label: 'Status' },
    { value: 'name', label: 'Product Name' },
  ],
  sales: [
    { value: 'date', label: 'Date' },
    { value: 'product', label: 'Product' },
    { value: 'payment', label: 'Payment' },
    { value: 'cashier', label: 'Cashier' },
  ],
  purchase: [
    { value: 'supplier', label: 'Supplier' },
    { value: 'date', label: 'Date' },
    { value: 'status', label: 'Status' },
  ],
  financial: [
    { value: 'date', label: 'Date' },
    { value: 'entryType', label: 'Entry Type' },
  ],
  customer: [
    { value: 'tier', label: 'Tier' },
    { value: 'name', label: 'Customer' },
  ],
  returns: [
    { value: 'reason', label: 'Reason' },
    { value: 'status', label: 'Status' },
  ],
};

const statusOptions: Record<string, Array<{ value: string; label: string }>> = {
  stock: [
    { value: '', label: 'All' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
  ],
  purchase: [
    { value: '', label: 'All' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
  ],
  returns: [
    { value: '', label: 'All' },
    { value: 'processed', label: 'Processed' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
  ],
};

const paymentOptions = [
  { value: '', label: 'All Payments' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'Mobile', label: 'Mobile' },
];

export default function ReportFilterBar({ reportType, filters, onChange, onApply, onReset }: Props) {
  const update = (key: keyof ReportFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const groups = groupByOptions[reportType] || groupByOptions.sales;
  const statuses = statusOptions[reportType] || [{ value: '', label: 'All' }];

  return (
    <div className="bg-white border border-neutral-200/60 rounded-[1.5rem] p-4 space-y-4 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <input
          type="date"
          className="px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 outline-none"
          value={filters.startDate}
          onChange={(e) => update('startDate', e.target.value)}
        />
        <input
          type="date"
          className="px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 outline-none"
          value={filters.endDate}
          onChange={(e) => update('endDate', e.target.value)}
        />
        <input
          type="text"
          placeholder="Product / category"
          className="px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 outline-none"
          value={filters.product}
          onChange={(e) => update('product', e.target.value)}
        />
        <select
          className="px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 outline-none bg-white"
          value={filters.groupBy}
          onChange={(e) => update('groupBy', e.target.value)}
        >
          {groups.map((option) => (
            <option key={option.value} value={option.value}>
              Group by {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <select
          className="px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 outline-none bg-white"
          value={filters.status}
          onChange={(e) => update('status', e.target.value)}
        >
          {statuses.map((option) => (
            <option key={option.value} value={option.value}>
              Status: {option.label}
            </option>
          ))}
        </select>

        <select
          className={cn(
            "px-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-neutral-900/10 outline-none bg-white",
            reportType !== 'sales' && 'opacity-60'
          )}
          value={filters.paymentMethod}
          disabled={reportType !== 'sales'}
          onChange={(e) => update('paymentMethod', e.target.value)}
        >
          {paymentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="xl:col-span-2 flex items-center px-3 rounded-xl border border-neutral-200 focus-within:ring-2 focus-within:ring-neutral-900/10">
          <Search size={16} className="text-neutral-400" />
          <input
            type="text"
            placeholder="Search in report data..."
            className="flex-1 border-none bg-transparent px-3 py-3 outline-none"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={onReset}
          className="px-5 py-2.5 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50"
        >
          Reset
        </button>
        <button
          onClick={onApply}
          className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
