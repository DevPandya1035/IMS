'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAppDispatch } from '../../../store/hooks';
import { addToast } from '../../../store/slices/toastSlice';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Plus, Eye, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '../../../components/auth/RoleGuard';

export default function SalesOrdersPage() {
  const dispatch = useAppDispatch();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales-orders', {
        params: {
          page,
          limit: 10,
        },
      });

      setOrders(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to fetch sales orders list.',
          type: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const columns = [
    {
      header: 'SO Number',
      accessor: (row: any) => (
        <span className="font-mono text-xs font-semibold text-white">{row.orderNumber}</span>
      ),
    },
    {
      header: 'Customer',
      accessor: (row: any) => <span className="font-semibold text-gray-300">{row.customerName}</span>,
    },
    {
      header: 'Warehouse',
      accessor: (row: any) => (
        <span className="text-xs text-gray-400">{row.warehouse?.warehouseName || '—'}</span>
      ),
    },
    {
      header: 'Order Date',
      accessor: (row: any) => <span>{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      header: 'Total Value',
      accessor: (row: any) => (
        <span className="font-semibold text-white">₹{Number(row.totalAmount).toLocaleString('en-IN')}</span>
      ),
    },
    {
      header: 'Payment',
      accessor: (row: any) => (
        <Badge color={row.isPaid ? 'emerald' : 'amber'}>{row.isPaid ? 'PAID' : 'PENDING'}</Badge>
      ),
    },
    {
      header: 'Status',
      accessor: (row: any) => {
        const statuses = {
          PENDING: { color: 'amber', label: 'PENDING' },
          CONFIRMED: { color: 'blue', label: 'CONFIRMED' },
          SHIPPED: { color: 'violet', label: 'SHIPPED' },
          DELIVERED: { color: 'emerald', label: 'DELIVERED' },
          CANCELLED: { color: 'gray', label: 'CANCELLED' },
        };
        const active = statuses[row.status as keyof typeof statuses] || { color: 'gray', label: row.status };
        return <Badge color={active.color as any}>{active.label}</Badge>;
      },
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center space-x-2">
          <Link
            href={`/sales/${row.id}`}
            className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors flex items-center space-x-1"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
            <span className="text-xs font-semibold">View</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales Orders</h1>
          <p className="text-sm text-gray-400">Track and fulfill customer sales orders, invoicing, and dispatches</p>
        </div>
        <RoleGuard permission="CREATE_SO">
          <Link
            href="/sales/new"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow shadow-blue-500/20 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create SO
          </Link>
        </RoleGuard>
      </div>

      {/* Grid view */}
      <div className="h-[calc(100vh-200px)]">
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
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
