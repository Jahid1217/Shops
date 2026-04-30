import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type Props = {
  rows: Array<Record<string, any>>;
};

const COLORS = ['#111827', '#0f766e', '#b45309', '#be123c', '#4338ca', '#0f172a', '#475569'];

function isNumeric(value: any) {
  return typeof value === 'number' && Number.isFinite(value);
}

export default function ReportCharts({ rows }: Props) {
  const { xKey, yKey, pieData } = useMemo(() => {
    if (!rows.length) return { xKey: null, yKey: null, pieData: [] as Array<Record<string, any>> };
    const sample = rows[0];
    const keys = Object.keys(sample);
    const numericKeys = keys.filter((key) => isNumeric(sample[key]));
    const x = keys.find((key) => !isNumeric(sample[key])) || keys[0];
    const y = numericKeys[0] || null;
    const pie = rows
      .slice(0, 6)
      .map((row) => ({
        name: String(row[x]),
        value: y ? Number(row[y] || 0) : 0,
      }))
      .filter((d) => d.value > 0);
    return { xKey: x, yKey: y, pieData: pie };
  }, [rows]);

  if (!rows.length || !xKey || !yKey) {
    return (
      <div className="bg-white border border-neutral-200/60 rounded-2xl p-10 text-center text-neutral-400 font-bold">
        Chart data not available for the selected report.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 shadow-sm h-[320px]">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-neutral-400 mb-3">Trend</p>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={yKey} stroke="#111827" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 shadow-sm h-[320px]">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-neutral-400 mb-3">Comparison</p>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={rows.slice(0, 12)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={yKey} fill="#111827" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 shadow-sm h-[320px] xl:col-span-2">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-neutral-400 mb-3">Distribution</p>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={96} label>
              {pieData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
