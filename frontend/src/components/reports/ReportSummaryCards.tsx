import React from 'react';
import { formatCurrency } from '../../lib/utils';

type Props = {
  summary: Record<string, any>;
};

const moneyKeys = ['amount', 'sales', 'value', 'price', 'revenue', 'cash', 'expense', 'loss', 'margin', 'spent'];

function formatValue(key: string, value: any) {
  if (typeof value === 'number' && moneyKeys.some((word) => key.toLowerCase().includes(word))) {
    return formatCurrency(value);
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}

function labelFromKey(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function ReportSummaryCards({ summary }: Props) {
  const entries = Object.entries(summary || {});
  if (!entries.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {entries.map(([key, value]) => (
        <div key={key} className="bg-white border border-neutral-200/60 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">{labelFromKey(key)}</p>
          <p className="text-2xl font-black text-neutral-900 mt-2">{formatValue(key, value)}</p>
        </div>
      ))}
    </div>
  );
}
