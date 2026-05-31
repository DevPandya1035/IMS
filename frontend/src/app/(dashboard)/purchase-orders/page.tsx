'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAppDispatch } from '../../../store/hooks';
import { addToast } from '../../../store/slices/toastSlice';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Plus, Eye, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '../../../components/auth/RoleGuard';

export default function PurchaseOrdersPage() {
  const dispatch = useAppDispatch();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchase-orders', {
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
          message: 'Failed to fetch purchase orders.',
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
      header: 'PO Number',
      accessor: (row: any) => <span className="font-mono text-xs font-semibold text-white">{row.orderNumber}</span>,
    },
    {
      header: 'Supplier',
      accessor: (row: any) => <span className="font-semibold text-gray-300">{row.supplier.supplierName}</span>,
    },
    {
      header: 'Order Date',
      accessor: (row: any) => <span>{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      header: 'Total Amount',
      accessor: (row: any) => (
        <span className="font-semibold text-white">₹{Number(row.totalAmount).toLocaleString('en-IN')}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: any) => {
        const statuses = {
          PENDING: { color: 'amber', label: 'PENDING' },
          APPROVED: { color: 'blue', label: 'APPROVED' },
          RECEIVED: { color: 'emerald', label: 'RECEIVED' },
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
            href={`/purchase-orders/${row.id}`}
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-gray-400">Track and manage vendor procurement lifecycles and approvals</p>
        </div>
        <RoleGuard permission="CREATE_PO">
          <Link
            href="/purchase-orders/new"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow shadow-blue-500/20 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create PO
          </Link>
        </RoleGuard>
      </div>

      {/* Warning banner about approval threshold */}
      <div className="bg-[#1b191f] border border-amber-500/25 p-4 rounded-2xl flex items-start space-x-3 text-amber-300">
        <ShieldAlert className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold">PO Approval Limit Notice</h4>
          <p className="text-xs mt-0.5 text-gray-400">
            Any Purchase Order with a total value exceeding <span className="font-semibold text-white">₹50,000</span> will remain in <span className="text-amber-400 font-semibold">PENDING</span> status until explicitly approved by an Admin or Manager before stock receipt can be executed.
          </p>
        </div>
      </div>

      {/* Grid view */}
      <div className="h-[calc(100vh-270px)]">
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
