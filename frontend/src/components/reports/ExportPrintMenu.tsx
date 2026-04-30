import React from 'react';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';

type Props = {
  onExportPdf: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
};

export default function ExportPrintMenu({ onExportPdf, onExportExcel, onPrint }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onExportPdf}
        className="px-5 py-3 rounded-xl border border-neutral-200 bg-white text-sm font-bold text-neutral-800 hover:bg-neutral-50 flex items-center gap-2"
      >
        <Download size={16} /> Export PDF
      </button>
      <button
        onClick={onExportExcel}
        className="px-5 py-3 rounded-xl border border-green-200 bg-green-50 text-sm font-bold text-green-700 hover:bg-green-100 flex items-center gap-2"
      >
        <FileSpreadsheet size={16} /> Export Excel
      </button>
      <button
        onClick={onPrint}
        className="px-5 py-3 rounded-xl border border-neutral-900 bg-neutral-900 text-sm font-bold text-white hover:bg-neutral-800 flex items-center gap-2"
      >
        <Printer size={16} /> Print
      </button>
    </div>
  );
}
