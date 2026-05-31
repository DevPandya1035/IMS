'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAppDispatch } from '../../../store/hooks';
import { addToast } from '../../../store/slices/toastSlice';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Eye, CreditCard, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '../../../components/auth/RoleGuard';

export default function InvoicesPage() {
  const dispatch = useAppDispatch();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices', {
        params: {
          page,
          limit: 10,
        },
      });

      setInvoices(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to fetch invoices list.',
          type: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page]);

  const handleOpenPayment = (invoice: any) => {
    // Calculate remaining unpaid balance
    const payments = invoice.payments || [];
    const paidSum = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const balance = Number(invoice.totalAmount) - paidSum;

    setSelectedInvoice(invoice);
    setPaymentAmount(Math.max(0, balance));
    setPaymentMethod('UPI');
    setPaymentReference('');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (paymentAmount <= 0) {
      dispatch(addToast({ message: 'Payment amount must be positive.', type: 'error' }));
      return;
    }

    try {
      setSavingPayment(true);
      await api.post('/invoices/payments', {
        invoiceId: selectedInvoice.id,
        salesOrderId: selectedInvoice.salesOrderId || null,
        purchaseOrderId: selectedInvoice.purchaseOrderId || null,
        amount: paymentAmount,
        paymentMethod,
        reference: paymentReference || null,
      });

      dispatch(
        addToast({
          message: 'Payment recorded successfully.',
          type: 'success',
        })
      );
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to record payment.',
          type: 'error',
        })
      );
    } finally {
      setSavingPayment(false);
    }
  };

  const columns = [
    {
      header: 'Invoice Number',
      accessor: (row: any) => (
        <span className="font-mono text-xs font-semibold text-white">{row.invoiceNumber}</span>
      ),
    },
    {
      header: 'Type',
      accessor: (row: any) => (
        <Badge color={(row.purchaseOrderId ? 'indigo' : 'blue') as any}>
          {row.purchaseOrderId ? 'PO Bill' : 'Sales Invoice'}
        </Badge>
      ),
    },
    {
      header: 'Order Reference',
      accessor: (row: any) => {
        const orderNumber = row.salesOrder?.orderNumber || row.purchaseOrder?.orderNumber || '—';
        return <span className="font-mono text-xs text-gray-400">{orderNumber}</span>;
      },
    },
    {
      header: 'Customer / Supplier',
      accessor: (row: any) => {
        const partnerName = row.salesOrder?.customerName || row.supplier?.supplierName || row.purchaseOrder?.supplier?.supplierName || '—';
        return <span className="font-semibold text-gray-300">{partnerName}</span>;
      },
    },
    {
      header: 'Invoice Date',
      accessor: (row: any) => <span>{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      header: 'Total Due',
      accessor: (row: any) => (
        <span className="font-semibold text-white">₹{Number(row.totalAmount).toLocaleString('en-IN')}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: any) => {
        const statuses = {
          PENDING: { color: 'amber', label: 'PENDING' },
          PARTIAL: { color: 'blue', label: 'PARTIAL' },
          PAID: { color: 'emerald', label: 'PAID' },
          OVERDUE: { color: 'red', label: 'OVERDUE' },
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
            href={`/invoices/${row.id}`}
            className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors flex items-center space-x-1"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
            <span className="text-xs font-semibold">View</span>
          </Link>
          <RoleGuard permission="PAY_SO">
            {row.status !== 'PAID' && row.status !== 'CANCELLED' && (
              <button
                onClick={() => handleOpenPayment(row)}
                className="p-1.5 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors flex items-center space-x-1"
                title="Record Payment"
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-xs font-semibold">Pay</span>
              </button>
            )}
          </RoleGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">GST Invoices</h1>
        <p className="text-sm text-gray-400">View tax-compliant invoices, track due dates, and record client transactions</p>
      </div>

      {/* Grid container */}
      <div className="h-[calc(100vh-200px)]">
        <DataTable
          columns={columns}
          data={invoices}
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

      {/* Record Payment Dialog Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-2xl space-y-5 animate-slide-in">
            <div className="flex items-center justify-between border-b border-[#22263f] pb-3">
              <h3 className="text-base font-semibold text-white tracking-tight">Record Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                }}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Invoice Number</p>
                <p className="font-semibold text-white font-mono">{selectedInvoice.invoiceNumber}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Payment Amount (INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === '' ? '' as any : parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none font-mono"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="CASH">Cash Payment</option>
                  <option value="NEFT">NEFT Bank Transfer</option>
                  <option value="RTGS">RTGS Bank Transfer</option>
                  <option value="CHEQUE">Cheque Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Transaction Reference Code
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none font-mono"
                  placeholder="e.g. UTR123456789"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#22263f]">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="px-4 py-2 bg-[#171926] hover:bg-[#1f2235] border border-[#2c324e] rounded-xl text-sm font-medium text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-medium transition-all shadow shadow-emerald-500/25 flex items-center"
                >
                  {savingPayment && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
