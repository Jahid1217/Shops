import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Layers2, LayoutList, Grid2x2, RefreshCcw } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import ReportFilterBar, { type ReportFilters } from '../components/reports/ReportFilterBar';
import ReportSummaryCards from '../components/reports/ReportSummaryCards';
import ReportDataGrid from '../components/reports/ReportDataGrid';
import ReportGroupedView from '../components/reports/ReportGroupedView';
import ReportCharts from '../components/reports/ReportCharts';
import ExportPrintMenu from '../components/reports/ExportPrintMenu';

type ReportType = 'stock' | 'sales' | 'purchase' | 'financial' | 'customer' | 'returns';
type ViewMode = 'list' | 'grouped' | 'graph' | 'combined';

type ReportResponse = {
  reportType: string;
  generatedAt: string;
  summary: Record<string, any>;
  listData: Array<Record<string, any>>;
  groupedData: Array<Record<string, any>>;
  chartData: Array<Record<string, any>>;
};

const reportTabs: Array<{ key: ReportType; label: string }> = [
  { key: 'stock', label: 'Stock' },
  { key: 'sales', label: 'Sales' },
  { key: 'purchase', label: 'Purchase' },
  { key: 'financial', label: 'Financial' },
  { key: 'customer', label: 'Customer' },
  { key: 'returns', label: 'Return & Damage' },
];

const viewModes: Array<{ key: ViewMode; label: string; icon: React.ComponentType<any> }> = [
  { key: 'list', label: 'List', icon: LayoutList },
  { key: 'grouped', label: 'Grouped', icon: Layers2 },
  { key: 'graph', label: 'Graph', icon: BarChart3 },
  { key: 'combined', label: 'Combined', icon: Grid2x2 },
];

const defaultFilters: ReportFilters = {
  startDate: '',
  endDate: '',
  product: '',
  category: '',
  status: '',
  paymentMethod: '',
  groupBy: 'date',
  search: '',
};

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('stock');
  const [viewMode, setViewMode] = useState<ViewMode>('combined');
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ReportResponse | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const printReport = useReactToPrint({
    contentRef: printRef,
    documentTitle: () => `${reportType}-report-${new Date().toISOString().slice(0, 10)}`,
  });

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });
      const query = params.toString();
      const endpoint = `/reports/${reportType}${query ? `?${query}` : ''}`;
      const result = await api.get<ReportResponse>(endpoint);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const exportRows = useMemo(() => {
    if (!data) return [];
    if (viewMode === 'grouped') return data.groupedData;
    if (viewMode === 'graph') return data.chartData;
    return data.listData;
  }, [data, viewMode]);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text(`${reportType.toUpperCase()} Report`, 14, 16);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    if (!exportRows.length) {
      doc.text('No data available for export.', 14, 32);
      doc.save(`${reportType}-report.pdf`);
      return;
    }

    const keys = Object.keys(exportRows[0]).filter((key) => typeof exportRows[0][key] !== 'object');
    const tableBody = exportRows.map((row) => keys.map((key) => String(row[key] ?? '-')));

    (doc as any).autoTable({
      head: [keys],
      body: tableBody,
      startY: 30,
      styles: { fontSize: 8 },
    });

    doc.save(`${reportType}-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportExcel = () => {
    const rows = exportRows.map((row) => {
      const plain: Record<string, any> = {};
      Object.entries(row).forEach(([key, value]) => {
        if (typeof value !== 'object') plain[key] = value;
      });
      return plain;
    });
    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, reportType.toUpperCase());
    XLSX.writeFile(wb, `${reportType}-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Advanced Reports</h1>
          <p className="text-neutral-500 font-medium mt-1">
            Multi-filter reporting with list, grouped, graph, and combined views.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchReport}
            className="px-5 py-3 rounded-xl border border-neutral-200 bg-white text-sm font-bold text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
          <ExportPrintMenu onExportPdf={exportPdf} onExportExcel={exportExcel} onPrint={printReport} />
        </div>
      </header>

      <div className="bg-white border border-neutral-200/60 rounded-[1.5rem] p-2 flex flex-wrap gap-2 shadow-sm">
        {reportTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setReportType(tab.key)}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
              reportType === tab.key
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-neutral-200/60 rounded-[1.5rem] p-2 flex flex-wrap gap-2 shadow-sm">
        {viewModes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => setViewMode(mode.key)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2',
              viewMode === mode.key
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            )}
          >
            <mode.icon size={15} />
            {mode.label}
          </button>
        ))}
      </div>

      <ReportFilterBar
        reportType={reportType}
        filters={filters}
        onChange={setFilters}
        onApply={fetchReport}
        onReset={resetFilters}
      />

      {loading ? (
        <div className="bg-white border border-neutral-200/60 rounded-2xl p-16 text-center text-neutral-500 font-bold">
          Loading report data...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 font-semibold">
          {error}
        </div>
      ) : (
        <>
          <ReportSummaryCards summary={data?.summary || {}} />

          {(viewMode === 'list' || viewMode === 'combined') && (
            <ReportDataGrid rows={data?.listData || []} />
          )}

          {(viewMode === 'grouped' || viewMode === 'combined') && (
            <ReportGroupedView rows={data?.groupedData || []} />
          )}

          {(viewMode === 'graph' || viewMode === 'combined') && (
            <ReportCharts rows={data?.chartData || []} />
          )}
        </>
      )}

      <div className="fixed -left-[9999px] top-0">
        <div ref={printRef} className="bg-white p-8 w-[960px]">
          <h2 className="text-2xl font-black mb-2">{reportType.toUpperCase()} REPORT</h2>
          <p className="text-sm text-neutral-500 mb-6">Generated {new Date().toLocaleString()}</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Object.entries(data?.summary || {}).map(([key, value]) => (
              <div key={key} className="border border-neutral-200 rounded-lg p-3">
                <p className="text-[10px] uppercase text-neutral-400 font-bold">{key}</p>
                <p className="font-bold text-neutral-900">{String(value)}</p>
              </div>
            ))}
          </div>
          <ReportDataGrid rows={exportRows} />
        </div>
      </div>
    </div>
  );
}
