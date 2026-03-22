'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Search, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  searchable?: boolean;
  searchKeys?: string[];
  onExport?: () => void;
  emptyMessage?: string;
  actions?: (item: T) => React.ReactNode;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  pageSize = 15,
  searchable = true,
  searchKeys = [],
  onExport,
  emptyMessage = 'لا توجد بيانات',
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Filter
  const filtered = data.filter(item => {
    if (!search) return true;
    const keys = searchKeys.length > 0 ? searchKeys : columns.map(c => c.key);
    return keys.some(key => {
      const val = item[key];
      return val?.toString().toLowerCase().includes(search.toLowerCase());
    });
  });

  // Sort
  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : filtered;

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {searchable && (
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{sorted.length} سجل</span>
          {onExport && (
            <button onClick={onExport} className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Download size={14} />
              تصدير
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={cn(
                    col.sortable !== false && 'cursor-pointer hover:bg-gray-100 select-none',
                    col.className
                  )}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {sortKey === col.key && (
                      <span className="text-primary-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="w-20">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-10 text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((item, i) => (
                <tr key={item.id || i}>
                  {columns.map(col => (
                    <td key={col.key} className={col.className}>
                      {col.render ? col.render(item) : item[col.key]?.toString() || '-'}
                    </td>
                  ))}
                  {actions && <td>{actions(item)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            صفحة {page} من {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium',
                    page === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
