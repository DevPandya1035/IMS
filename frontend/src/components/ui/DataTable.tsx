'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, Loader2 } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  key?: string;
  sortable?: boolean;
}

interface Pagination {
  page: number;
  totalPages: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: Pagination;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  pagination,
  searchPlaceholder = 'Search records...',
  searchQuery,
  onSearchChange,
  onSortChange,
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (!onSortChange) return;

    let nextDir: 'asc' | 'desc' = 'asc';
    if (sortField === field) {
      nextDir = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    setSortField(field);
    setSortDirection(nextDir);
    onSortChange(field, nextDir);
  };

  return (
    <div className="bg-[#11131e] border border-[#22263f] rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Table Action Header */}
      {onSearchChange !== undefined && (
        <div className="p-5 border-b border-[#22263f] flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0d0e15] border border-[#22263f] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors duration-200"
              placeholder={searchPlaceholder}
            />
          </div>
        </div>
      )}

      {/* Main Table Grid */}
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#141725] border-b border-[#22263f]">
              {columns.map((col, index) => {
                const isSortable = col.sortable && col.key;
                return (
                  <th
                    key={col.key || index}
                    onClick={() => isSortable && handleSort(col.key!)}
                    className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 ${
                      isSortable ? 'cursor-pointer hover:text-white transition-colors select-none' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>{col.header}</span>
                      {isSortable && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#22263f] text-sm text-gray-300">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                    <span className="text-gray-500 font-medium">Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center text-gray-500 font-medium">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row: any, rowIndex) => (
                <tr key={row.id || rowIndex} className="hover:bg-[#131625] transition-colors duration-150">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : (row[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && data.length > 0 && (
        <div className="p-4 bg-[#141725] border-t border-[#22263f] flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Showing Page <span className="font-semibold text-white">{pagination.page}</span> of{' '}
            <span className="font-semibold text-white">{pagination.totalPages || 1}</span> (
            <span className="font-semibold text-white">{pagination.total}</span> total records)
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 border border-[#22263f] hover:border-gray-500 disabled:opacity-30 disabled:hover:border-[#22263f] rounded-xl text-gray-400 hover:text-white transition-colors focus:outline-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 border border-[#22263f] hover:border-gray-500 disabled:opacity-30 disabled:hover:border-[#22263f] rounded-xl text-gray-400 hover:text-white transition-colors focus:outline-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
