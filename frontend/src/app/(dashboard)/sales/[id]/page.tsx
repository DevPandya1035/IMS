'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAppDispatch } from '../../../../store/hooks';
import { addToast } from '../../../../store/slices/toastSlice';
import { Badge } from '../../../../components/ui/Badge';
import { RoleGuard } from '../../../../components/auth/RoleGuard';
import { Loader2, ArrowLeft, Check, Truck, Package, XCircle, FileText, Landmark } from 'lucide-react';
import Link from 'next/link';

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const id = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/sales-orders/${id}`);
      setOrder(res.data.data);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to fetch sales order details.',
          type: 'error',
        })
      );
      router.push('/sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrderDetail();
  }, [id]);

  const handleConfirm = async () => {
    if (!window.confirm('Confirm order? This will allocate warehouse stock and generate an invoice.')) return;
    try {
      setActionLoading(true);
      await api.patch(`/sales-orders/${id}/confirm`);
      dispatch(addToast({ message: 'Order confirmed and invoice generated.', type: 'success' }));
      fetchOrderDetail();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to confirm order.',
          type: 'error',
        })
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleShip = async () => {
    if (!window.confirm('Mark order as shipped? This will log stock-out movements.')) return;
    try {
      setActionLoading(true);
      await api.patch(`/sales-orders/${id}/ship`);
      dispatch(addToast({ message: 'Order status set to SHIPPED.', type: 'success' }));
      fetchOrderDetail();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to ship order.',
          type: 'error',
        })
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!window.confirm('Mark order as delivered?')) return;
    try {
      setActionLoading(true);
      await api.patch(`/sales-orders/${id}/deliver`);
      dispatch(addToast({ message: 'Order status set to DELIVERED.', type: 'success' }));
      fetchOrderDetail();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to deliver order.',
          type: 'error',
        })
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? If confirmed, allocated stock will be returned to the warehouse.')) return;
    try {
      setActionLoading(true);
      await api.patch(`/sales-orders/${id}/cancel`);
      dispatch(addToast({ message: 'Sales order cancelled.', type: 'success' }));
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
    CONFIRMED: { color: 'blue', label: 'CONFIRMED' },
    SHIPPED: { color: 'violet', label: 'SHIPPED' },
    DELIVERED: { color: 'emerald', label: 'DELIVERED' },
    CANCELLED: { color: 'gray', label: 'CANCELLED' },
  };
  const activeStatus = statuses[order.status as keyof typeof statuses] || { color: 'gray', label: order.status };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/sales" className="hover:text-white transition-colors flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to list
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{order.orderNumber}</h1>
            <Badge color={activeStatus.color as any}>{activeStatus.label}</Badge>
            <Badge color={order.isPaid ? 'emerald' : 'amber'}>{order.isPaid ? 'PAID' : 'UNPAID'}</Badge>
          </div>
          <p className="text-sm text-gray-400 mt-1">Order Details and Lifecycle actions</p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap items-center gap-3">
          {order.status === 'PENDING' && (
            <>
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center shadow shadow-blue-500/25"
              >
                {actionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Confirm Order
              </button>
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

          {order.status === 'CONFIRMED' && (
            <>
              <button
                onClick={handleShip}
                disabled={actionLoading}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center shadow shadow-violet-500/20"
              >
                {actionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                Ship Order
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 hover:border-red-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center"
              >
                Cancel Order
              </button>
            </>
          )}

          {order.status === 'SHIPPED' && (
            <button
              onClick={handleDeliver}
              disabled={actionLoading}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold transition-all flex items-center shadow shadow-emerald-500/20"
            >
              {actionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Package className="h-4 w-4 mr-2" />}
              Deliver Order
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Ordered Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#22263f] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3">Product SKU</th>
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3 text-right">Quantity</th>
                    <th className="pb-3 text-right">Unit Price</th>
                    <th className="pb-3 text-right">Discount</th>
                    <th className="pb-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22263f] text-sm text-gray-300">
                  {order.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3.5 font-mono text-xs text-gray-400">{item.product.sku}</td>
                      <td className="py-3.5 font-medium text-white">{item.productName}</td>
                      <td className="py-3.5 text-right">{item.quantity} units</td>
                      <td className="py-3.5 text-right">
                        ₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 text-right text-red-400">
                        -₹{Number(item.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 text-right font-semibold text-white font-mono">
                        ₹
                        {(item.quantity * Number(item.unitPrice) - Number(item.discount)).toLocaleString(
                          'en-IN',
                          { minimumFractionDigits: 2 }
                        )}
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
          {/* Client Details */}
          <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Client Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Client Name</p>
                <p className="font-semibold text-white">{order.customerName}</p>
              </div>
              {order.customerEmail && (
                <div>
                  <p className="text-xs text-gray-500">Email Address</p>
                  <p className="text-gray-300 truncate">{order.customerEmail}</p>
                </div>
              )}
              {order.customerPhone && (
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="text-gray-300">{order.customerPhone}</p>
                </div>
              )}
              {order.warehouse && (
                <div>
                  <p className="text-xs text-gray-500">Stock Location</p>
                  <p className="text-gray-300 font-semibold">{order.warehouse.warehouseName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing summary */}
          <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Placed On</span>
                <span className="text-gray-300">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sales Agent</span>
                <span className="text-gray-300">{order.creator?.name || 'System'}</span>
              </div>
              <div className="border-t border-[#22263f] pt-3 mt-3 flex justify-between items-baseline">
                <span className="font-semibold text-white">Grand Total</span>
                <span className="text-lg font-bold text-white font-mono">
                  ₹{Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Invoice Link */}
          {order.invoice && (
            <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 block">Linked Invoice</span>
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

          {/* Notes */}
          {order.notes && (
            <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">Order Notes</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
