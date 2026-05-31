'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAppDispatch } from '../../../../store/hooks';
import { addToast } from '../../../../store/slices/toastSlice';
import { Loader2, ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../../../../components/ui/Badge';
import { RoleGuard } from '../../../../components/auth/RoleGuard';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/invoices/${id}`);
        setInvoice(res.data.data);
      } catch (err: any) {
        dispatch(
          addToast({
            message: 'Failed to fetch invoice details.',
            type: 'error',
          })
        );
        router.push('/invoices');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!invoice) return null;

  const statuses = {
    PENDING: { color: 'amber', label: 'PENDING' },
    PAID: { color: 'emerald', label: 'PAID' },
    OVERDUE: { color: 'red', label: 'OVERDUE' },
    CANCELLED: { color: 'gray', label: 'CANCELLED' },
  };
  const activeStatus = statuses[invoice.status as keyof typeof statuses] || { color: 'gray', label: invoice.status };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header controls (Hidden during print) */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/invoices" className="hover:text-white transition-colors flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to list
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <RoleGuard permission="SEND_INVOICE">
            <div className="flex items-center space-x-2 bg-[#171926] border border-[#2c324e] rounded-xl px-3 py-1.5 text-xs text-gray-300">
              <span>Status:</span>
              <select
                value={invoice.status}
                onChange={async (e) => {
                  try {
                    const newStatus = e.target.value;
                    const res = await api.patch(`/invoices/${invoice.id}/status`, { status: newStatus });
                    setInvoice({ ...invoice, status: res.data.data.status });
                    dispatch(addToast({ message: `Status updated to ${newStatus}`, type: 'success' }));
                  } catch (err: any) {
                    dispatch(addToast({ message: err.response?.data?.error || 'Failed to update status', type: 'error' }));
                  }
                }}
                className="bg-transparent border-none text-white focus:outline-none cursor-pointer font-semibold"
              >
                <option value="PENDING" className="bg-[#11131e] text-amber-400">PENDING</option>
                <option value="PARTIAL" className="bg-[#11131e] text-blue-400">PARTIAL</option>
                <option value="PAID" className="bg-[#11131e] text-emerald-400">PAID</option>
                <option value="OVERDUE" className="bg-[#11131e] text-red-400">OVERDUE</option>
                <option value="CANCELLED" className="bg-[#11131e] text-gray-400">CANCELLED</option>
              </select>
            </div>
          </RoleGuard>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow shadow-blue-500/20 flex items-center"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice sheet (Stylized A4 Sheet in CSS) */}
      <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-8 shadow-2xl print:bg-white print:text-black print:border-none print:p-0 print:shadow-none space-y-8">
        
        {/* Header grid */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-[#22263f] pb-6 print:border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-white print:text-black tracking-tight uppercase">
              {invoice.purchaseOrderId ? 'Supplier Bill' : 'Tax Invoice'}
            </h1>
            <p className="text-xs text-gray-400 print:text-gray-500 mt-1 font-mono">{invoice.invoiceNumber}</p>
            <div className="mt-2.5 flex items-center space-x-2 print:hidden">
              <Badge color={activeStatus.color as any}>{activeStatus.label}</Badge>
            </div>
          </div>
          <div className="text-left md:text-right text-xs text-gray-400 print:text-gray-600 space-y-1">
            <h4 className="font-semibold text-white print:text-black text-sm">IMS Inc.</h4>
            <p>123 Enterprise Way, Sector 15</p>
            <p>Navi Mumbai, MH, 400705</p>
            <p className="font-mono">GSTIN: 27IPROA1234F1Z9</p>
          </div>
        </div>

        {/* Client & Metadata Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-400 print:text-gray-700">
          <div>
            {invoice.salesOrder ? (
              <>
                <h4 className="font-semibold text-white print:text-black uppercase tracking-wider mb-2">Billed To:</h4>
                <p className="font-bold text-white print:text-black text-sm">{invoice.salesOrder.customerName}</p>
                {invoice.salesOrder.customerEmail && <p className="mt-1">Email: {invoice.salesOrder.customerEmail}</p>}
                {invoice.salesOrder.customerPhone && <p>Phone: {invoice.salesOrder.customerPhone}</p>}
                {invoice.customer?.gstin && <p className="font-mono mt-1 text-gray-500">GSTIN: {invoice.customer.gstin}</p>}
                {invoice.customer?.address && <p className="mt-2 text-gray-300 print:text-gray-600 leading-relaxed max-w-xs">{invoice.customer.address}</p>}
              </>
            ) : invoice.purchaseOrder ? (
              <>
                <h4 className="font-semibold text-white print:text-black uppercase tracking-wider mb-2">Supplier / Vendor:</h4>
                <p className="font-bold text-white print:text-black text-sm">{invoice.purchaseOrder.supplier.supplierName}</p>
                {invoice.purchaseOrder.supplier.email && <p className="mt-1">Email: {invoice.purchaseOrder.supplier.email}</p>}
                {invoice.purchaseOrder.supplier.phone && <p>Phone: {invoice.purchaseOrder.supplier.phone}</p>}
                {invoice.purchaseOrder.supplier.address && <p className="mt-2 text-gray-300 print:text-gray-600 leading-relaxed max-w-xs">{invoice.purchaseOrder.supplier.address}</p>}
              </>
            ) : (
              <p>N/A</p>
            )}
          </div>
          <div className="space-y-2 md:text-right flex flex-col md:items-end">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Invoice Date</p>
              <p className="font-semibold text-white print:text-black">{new Date(invoice.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Due Date</p>
              <p className="font-semibold text-white print:text-black">
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Order Reference</p>
              <p className="font-mono text-gray-300 print:text-gray-700">
                {invoice.salesOrder ? invoice.salesOrder.orderNumber : (invoice.purchaseOrder ? invoice.purchaseOrder.orderNumber : 'N/A')}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Items table */}
        <div className="border-t border-b border-[#22263f] py-4 print:border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-gray-500 font-semibold uppercase tracking-wider border-b border-[#22263f] pb-2 print:border-gray-200 print:text-gray-600">
                  <th className="pb-2">Product</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Discount</th>
                  <th className="pb-2 text-right">Taxable Value</th>
                  <th className="pb-2 text-right">CGST (9%)</th>
                  <th className="pb-2 text-right">SGST (9%)</th>
                  <th className="pb-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22263f]/60 text-gray-300 print:divide-gray-100 print:text-gray-800">
                {invoice.items.map((item: any) => (
                  <tr key={item.id} className="align-top">
                    <td className="py-3 font-semibold text-white print:text-black">{item.productName}</td>
                    <td className="py-3 text-right">{item.quantity} units</td>
                    <td className="py-3 text-right">₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-right text-red-400 print:text-red-600">-₹{Number(item.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-right font-mono">₹{Number(item.taxableValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-right font-mono">₹{Number(item.cgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-right font-mono">₹{Number(item.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-right font-semibold text-white print:text-black font-mono">
                      ₹{Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex flex-col md:flex-row md:justify-between items-start gap-6">
          <div className="text-xs text-gray-500 max-w-sm">
            <h4 className="font-semibold text-white print:text-black mb-2 uppercase">Declaration</h4>
            <p className="leading-relaxed">
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Taxes are calculated in compliance with GST India rules.
            </p>
          </div>

          <div className="w-full md:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-gray-400 print:text-gray-600">
              <span>Subtotal</span>
              <span className="font-mono">₹{Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-red-400 print:text-red-600">
              <span>Discount</span>
              <span className="font-mono">-₹{Number(invoice.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-gray-400 print:text-gray-600">
              <span>Taxable Value</span>
              <span className="font-mono">₹{Number(invoice.taxableAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-gray-400 print:text-gray-600">
              <span>CGST Amount (9%)</span>
              <span className="font-mono">₹{Number(invoice.cgstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-gray-400 print:text-gray-600">
              <span>SGST Amount (9%)</span>
              <span className="font-mono">₹{Number(invoice.sgstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {Number(invoice.adjustment) !== 0 && (
              <div className="flex justify-between text-gray-400 print:text-gray-600">
                <span>Adjustment</span>
                <span className="font-mono">
                  {Number(invoice.adjustment) > 0 ? '+' : ''}₹{Number(invoice.adjustment).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="border-t border-[#22263f] print:border-gray-200 pt-3 mt-3 flex justify-between items-baseline">
              <span className="font-bold text-white print:text-black">Grand Total</span>
              <span className="text-lg font-bold text-white print:text-black font-mono">
                ₹{Number(invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
