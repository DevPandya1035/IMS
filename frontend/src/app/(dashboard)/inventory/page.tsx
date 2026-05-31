'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAppDispatch } from '../../../store/hooks';
import { addToast } from '../../../store/slices/toastSlice';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { ShieldAlert, ArrowUpDown, Filter, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
  const dispatch = useAppDispatch();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory', {
        params: {
          page,
          limit: 10,
          search: searchQuery,
          warehouseId: selectedWarehouse || undefined,
          lowStockOnly: lowStockOnly ? 'true' : 'false',
        },
      });

      setInventory(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to fetch inventory stock levels.',
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
    fetchInventory();
  }, [page, searchQuery, selectedWarehouse, lowStockOnly]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedWarehouse('');
    setLowStockOnly(false);
    setPage(1);
  };

  const columns = [
    {
      header: 'SKU',
      accessor: (row: any) => <span className="font-mono text-xs font-semibold text-gray-300">{row.product.sku}</span>,
    },
    {
      header: 'Product Name',
      accessor: (row: any) => <span className="font-semibold text-white">{row.product.name}</span>,
    },
    {
      header: 'Warehouse',
      accessor: (row: any) => (
        <div>
          <span className="font-semibold text-white">{row.warehouse.warehouseName}</span>
          <span className="block text-[10px] text-gray-500">{row.warehouse.location}</span>
        </div>
      ),
    },
    {
      header: 'Bin Location',
      accessor: (row: any) => (
        <span className="text-gray-400 font-mono text-xs">{row.binLocation || 'Unassigned'}</span>
      ),
    },
    {
      header: 'Quantity on Hand',
      accessor: (row: any) => {
        const isLow = row.quantity <= row.product.reorderLevel;
        return (
          <div className="flex items-center space-x-2">
            <span className={`font-bold ${isLow ? 'text-amber-500' : 'text-white'}`}>
              {row.quantity} units
            </span>
            {isLow && (
              <Badge color="amber">
                <ShieldAlert className="h-3 w-3 mr-1" />
                Low Stock
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: 'Price (INR)',
      accessor: (row: any) => <span>₹{Number(row.product.price).toLocaleString('en-IN')}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Stock Levels</h1>
          <p className="text-sm text-gray-400">Monitor physical quantities and bin locations across warehouses</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/inventory/movements"
            className="px-4 py-2 bg-[#171926] hover:bg-[#1f2235] border border-[#2c324e] rounded-xl text-sm font-medium text-gray-300 transition-colors"
          >
            View Logs
          </Link>
          <Link
            href="/inventory/adjustments"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow shadow-blue-500/20"
          >
            Adjust Stock
          </Link>
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

          {/* Low stock check toggle */}
          <button
            onClick={() => {
              setLowStockOnly(!lowStockOnly);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              lowStockOnly
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'border-[#22263f] bg-[#0d0e15] text-gray-400 hover:text-white'
            }`}
          >
            Show Low Stock Only
          </button>
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
          data={inventory}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setPage(1);
          }}
          pagination={{
            page,
            totalPages,
            limit: 10,
            total,
            onPageChange: (p) => setPage(p),
          }}
        />
      </div>
    </div>
  );
}
