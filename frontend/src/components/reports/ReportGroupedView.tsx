import React from 'react';

type Props = {
  rows: Array<Record<string, any>>;
};

function humanizeKey(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function ReportGroupedView({ rows }: Props) {
  if (!rows.length) {
    return (
      <div className="bg-white border border-neutral-200/60 rounded-2xl p-10 text-center text-neutral-400 font-bold">
        No grouped data available.
      </div>
    );
  }

  const headers = Object.keys(rows[0]);

  return (
    <div className="bg-white border border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              {headers.map((header) => (
                <th key={header} className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400">
                  {humanizeKey(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-neutral-50/60">
                {headers.map((header) => (
                  <td key={header} className="px-5 py-4 text-sm font-semibold text-neutral-700">
                    {row[header] === null || row[header] === undefined ? '-' : String(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
