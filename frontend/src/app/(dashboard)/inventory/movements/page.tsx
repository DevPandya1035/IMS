'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/toastSlice';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Filter, RotateCcw, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StockMovementsPage() {
  const dispatch = useAppDispatch();
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [movementType, setMovementType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/movements', {
        params: {
          page,
          limit: 15,
          warehouseId: selectedWarehouse || undefined,
          movementType: movementType || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });

      setMovements(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to fetch inventory movements log.',
          type: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [page, selectedWarehouse, movementType, startDate, endDate]);

  const handleReset = () => {
    setSelectedWarehouse('');
    setMovementType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const columns = [
    {
      header: 'Date & Time',
      accessor: (row: any) => (
        <div>
          <span className="text-white font-medium">{new Date(row.createdAt).toLocaleDateString()}</span>
          <span className="block text-[10px] text-gray-500">
            {new Date(row.createdAt).toLocaleTimeString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Product Details',
      accessor: (row: any) => (
        <div>
          <span className="font-semibold text-white">{row.product.name}</span>
          <span className="block text-xs font-mono text-gray-500">{row.product.sku}</span>
        </div>
      ),
    },
    {
      header: 'Warehouse',
      accessor: (row: any) => <span className="text-gray-300">{row.warehouse.warehouseName}</span>,
    },
    {
      header: 'Movement Type',
      accessor: (row: any) => {
        const types = {
          STOCK_IN: { color: 'emerald', label: 'STOCK IN' },
          STOCK_OUT: { color: 'red', label: 'STOCK OUT' },
          TRANSFER_IN: { color: 'blue', label: 'TRANSFER IN' },
          TRANSFER_OUT: { color: 'blue', label: 'TRANSFER OUT' },
        };
        const active = types[row.movementType as keyof typeof types] || { color: 'gray', label: row.movementType };
        return <Badge color={active.color as any}>{active.label}</Badge>;
      },
    },
    {
      header: 'Qty Change',
      accessor: (row: any) => {
        const isPos = row.quantity > 0;
        return (
          <span className={`font-bold ${isPos ? 'text-green-400' : 'text-red-400'}`}>
            {isPos ? `+${row.quantity}` : row.quantity} units
          </span>
        );
      },
    },
    {
      header: 'Reference',
      accessor: (row: any) => (
        <div>
          <span className="text-gray-400 text-xs">{row.reference || '—'}</span>
          {row.notes && <span className="block text-[10px] text-gray-600 truncate max-w-xs">{row.notes}</span>}
        </div>
      ),
    },
    {
      header: 'Staff Member',
      accessor: (row: any) => (
        <span className="text-xs text-gray-400 font-medium">{row.user?.name || 'System / Auto'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/inventory" className="hover:text-white transition-colors flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to levels
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Stock Movements Log</h1>
          <p className="text-sm text-gray-400">Comprehensive audit trail of all warehouse stock additions, deductions, and transfers</p>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-[#11131e] border border-[#22263f] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Warehouse Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 flex items-center">
              <Filter className="h-3.5 w-3.5 mr-1" />
              Warehouse:
            </span>
            <select
              value={selectedWarehouse}
              onChange={(e) => {
                setSelectedWarehouse(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-[#0d0e15] border border-[#22263f] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.warehouseName}
                </option>
              ))}
            </select>
          </div>

          {/* Type Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Type:</span>
            <select
              value={movementType}
              onChange={(e) => {
                setMovementType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-[#0d0e15] border border-[#22263f] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">All Types</option>
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
              <option value="TRANSFER_IN">Transfer In</option>
              <option value="TRANSFER_OUT">Transfer Out</option>
            </select>
          </div>

          {/* Date range picker inputs */}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span>Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 bg-[#0d0e15] border border-[#22263f] rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 bg-[#0d0e15] border border-[#22263f] rounded-lg text-white focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
        </div>

        {/* Reset Filter Button */}
        <button
          onClick={handleReset}
          className="text-xs text-gray-500 hover:text-white transition-colors flex items-center space-x-1"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Grid container */}
      <div className="h-[calc(100vh-270px)]">
        <DataTable
          columns={columns}
          data={movements}
          loading={loading}
          pagination={{
            page,
            totalPages,
            limit: 15,
            total,
            onPageChange: (p: number) => setPage(p),
          }}
        />
      </div>
    </div>
  );
}
