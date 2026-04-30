import React, { useMemo, useState } from 'react';

type Props = {
  rows: Array<Record<string, any>>;
};

const PAGE_SIZE = 10;

function readableHeader(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function primitive(value: any) {
  return typeof value !== 'object' || value === null;
}

export default function ReportDataGrid({ rows }: Props) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]).filter((key) => primitive(rows[0][key]));
  }, [rows]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const cloned = [...rows];
    cloned.sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      if (left === right) return 0;
      if (left === null || left === undefined) return 1;
      if (right === null || right === undefined) return -1;
      if (typeof left === 'number' && typeof right === 'number') {
        return sortDirection === 'asc' ? left - right : right - left;
      }
      return sortDirection === 'asc'
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });
    return cloned;
  }, [rows, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('desc');
  };

  if (!rows.length) {
    return (
      <div className="bg-white border border-neutral-200/60 rounded-2xl p-10 text-center text-neutral-400 font-bold">
        No records found for current filters.
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 cursor-pointer"
                  onClick={() => handleSort(column)}
                >
                  {readableHeader(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pageRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-neutral-50/60">
                {columns.map((column) => (
                  <td key={column} className="px-5 py-4 text-sm font-medium text-neutral-700">
                    {row[column] === null || row[column] === undefined ? '-' : String(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100 bg-neutral-50">
        <p className="text-xs font-semibold text-neutral-500">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-bold disabled:opacity-40"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <button
            className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-bold disabled:opacity-40"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
