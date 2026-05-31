'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAppDispatch } from '../../../../store/hooks';
import { addToast } from '../../../../store/slices/toastSlice';
import { Badge } from '../../../../components/ui/Badge';
import { RoleGuard, usePermission } from '../../../../components/auth/RoleGuard';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, PackageCheck, Truck, Home, FileText, Landmark } from 'lucide-react';
import Link from 'next/link';

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const id = params.id as string;
  const { checkPermission } = usePermission();

  const [order, setOrder] = useState<any>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/purchase-orders/${id}`);
      setOrder(res.data.data);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to fetch purchase order details.',
          type: 'error',
        })
      );
      router.push('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
      fetchWarehouses();
    }
  }, [id]);

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this purchase order?')) return;
    try {
      setActionLoading(true);
      await api.patch(`/purchase-orders/${id}/approve`);
      dispatch(addToast({ message: 'Purchase order approved successfully.', type: 'success' }));
      fetchOrderDetail();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to approve order.',
          type: 'error',
        })
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this purchase order?')) return;
    try {
      setActionLoading(true);
      await api.patch(`/purchase-orders/${id}/cancel`);
      dispatch(addToast({ message: 'Purchase order cancelled.', type: 'success' }));
      fetchOrderDetail();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to cancel order.',
          type: 'error',
        })
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!selectedWarehouse) {
      dispatch(addToast({ message: 'Please select a destination warehouse to stock-in items.', type: 'error' }));
      return;
    }
    if (!window.confirm('Confirm receipt of goods? This will increment inventory.')) return;

    try {
      setActionLoading(true);
      await api.patch(`/purchase-orders/${id}/receive`, { warehouseId: selectedWarehouse });
      dispatch(addToast({ message: 'Goods received and stock incremented.', type: 'success' }));
      fetchOrderDetail();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to receive goods.',
          type: 'error',
        })
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const statuses = {
    PENDING: { color: 'amber', label: 'PENDING' },
    APPROVED: { color: 'blue', label: 'APPROVED' },
    RECEIVED: { color: 'emerald', label: 'RECEIVED' },
    CANCELLED: { color: 'gray', label: 'CANCELLED' },
  };
  const activeStatus = statuses[order.status as keyof typeof statuses] || { color: 'gray', label: order.status };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/purchase-orders" className="hover:text-white transition-colors flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to list
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{order.orderNumber}</h1>
            <Badge color={activeStatus.color as any}>{activeStatus.label}</Badge>
          </div>
          <p className="text-sm text-gray-400 mt-1">Order Details and Lifecycle Actions</p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap items-center gap-3">
          {order.status === 'PENDING' && (
            <>
              <RoleGuard permission="APPROVE_PO">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center"
                >
                  {actionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Approve Order
                </button>
              </RoleGuard>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 hover:border-red-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Order
              </button>
            </>
          )}

          {order.status === 'APPROVED' && (
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-[#11131e] border border-[#22263f] p-3 rounded-2xl">
              <div className="flex items-center space-x-2">
                <Home className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="px-3 py-1.5 bg-[#0d0e15] border border-[#22263f] rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="">Select Destination Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.warehouseName}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleReceive}
                disabled={actionLoading}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center"
              >
                {actionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <PackageCheck className="h-4 w-4 mr-2" />}
                Receive Goods
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 hover:border-red-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center"
              >
                Cancel Order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Items Table Card */}
          <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Ordered Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#22263f] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3">Product SKU</th>
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3 text-right">Quantity</th>
                    <th className="pb-3 text-right">Cost Price</th>
                    <th className="pb-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22263f] text-sm text-gray-300">
                  {order.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3.5 font-mono text-xs text-gray-400">{item.product.sku}</td>
                      <td className="py-3.5 font-medium text-white">{item.product.name}</td>
                      <td className="py-3.5 text-right">{item.quantity} units</td>
                      <td className="py-3.5 text-right">₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3.5 text-right font-semibold text-white font-mono">
                        ₹{(item.quantity * Number(item.unitPrice)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments Log */}
          {order.payments && order.payments.length > 0 && (
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center">
                <Landmark className="h-4 w-4 mr-2 text-emerald-400" /> Recorded Payments
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#22263f] text-gray-500 font-semibold uppercase pb-2">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Reference</th>
                      <th className="pb-2">Method</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22263f]/60 text-gray-300">
                    {order.payments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-2.5">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5 font-mono text-gray-400">{p.reference || '—'}</td>
                        <td className="py-2.5"><Badge color="blue">{p.paymentMethod}</Badge></td>
                        <td className="py-2.5 text-right font-semibold text-white font-mono">
                          ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Info panel sidebar */}
        <div className="space-y-6">
          {/* Supplier Info Card */}
          <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center">
              <Truck className="h-4 w-4 mr-2 text-blue-400" /> Vendor Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Supplier Name</p>
                <p className="font-semibold text-white">{order.supplier.supplierName}</p>
              </div>
              {order.supplier.contactPerson && (
                <div>
                  <p className="text-xs text-gray-500">Contact Person</p>
                  <p className="text-gray-300">{order.supplier.contactPerson}</p>
                </div>
              )}
              {order.supplier.email && (
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-gray-300">{order.supplier.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Summary Card */}
          <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Date Placed</span>
                <span className="text-gray-300">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created By</span>
                <span className="text-gray-300">{order.creator?.name || 'System'}</span>
              </div>
              {order.approver && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Approved By</span>
                  <span className="text-gray-300">{order.approver.name}</span>
                </div>
              )}
              <div className="border-t border-[#22263f] pt-3 mt-3 flex justify-between items-baseline">
                <span className="font-semibold text-white">Grand Total</span>
                <span className="text-lg font-bold text-white font-mono">
                  ₹{Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          {order.notes && (
            <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">Order Notes</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{order.notes}</p>
            </div>
          )}

          {/* Linked Bill/Invoice Card */}
          {order.invoice && (
            <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 block">Linked Bill</span>
                <span className="text-sm font-semibold text-white font-mono">{order.invoice.invoiceNumber}</span>
              </div>
              <Link
                href={`/invoices/${order.invoice.id}`}
                className="px-3.5 py-1.5 bg-[#171926] hover:bg-[#1f2235] border border-[#2c324e] rounded-xl text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center"
              >
                <FileText className="h-3.5 w-3.5 mr-1" /> View
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
