'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAppDispatch } from '../../../../store/hooks';
import { addToast } from '../../../../store/slices/toastSlice';
import { Trash2, Plus, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface POItem {
  productId: string;
  quantity: number | '';
  unitPrice: number | '';
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form states
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [items, setItems] = useState<POItem[]>([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState('');
  const [orderDiscount, setOrderDiscount] = useState<number | ''>(0);
  const [orderAdjustment, setOrderAdjustment] = useState<number | ''>(0);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setFetching(true);
        const [supRes, prodRes] = await Promise.all([
          api.get('/suppliers'),
          api.get('/products', { params: { limit: 1000, isActive: 'true' } }),
        ]);
        setSuppliers(supRes.data.data);
        setProducts(prodRes.data.data);
      } catch (err) {
        dispatch(
          addToast({
            message: 'Failed to fetch form options.',
            type: 'error',
          })
        );
      } finally {
        setFetching(false);
      }
    };
    fetchOptions();
  }, [dispatch]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof POItem, value: any) => {
    setItems((prev) => {
      const nextItems = [...prev];
      const item = { ...nextItems[index]! };

      if (field === 'productId') {
        item.productId = value;
        // Auto populate unit price with product price or costPrice
        const prod = products.find((p) => p.id === value);
        if (prod) {
          item.unitPrice = Number(prod.costPrice || prod.price || 0);
        }
      } else if (field === 'quantity') {
        item.quantity = value === '' ? '' : Math.max(0, parseInt(value) || 0);
      } else if (field === 'unitPrice') {
        item.unitPrice = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
      }

      nextItems[index] = item;
      return nextItems;
    });
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplier) {
      dispatch(addToast({ message: 'Please select a supplier.', type: 'error' }));
      return;
    }

    const parsedItems = items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
    }));

    const invalidItem = parsedItems.some((item) => !item.productId || item.quantity <= 0 || item.unitPrice <= 0);
    if (invalidItem) {
      dispatch(addToast({ message: 'Please complete all items with valid quantities and prices.', type: 'error' }));
      return;
    }

    try {
      setLoading(true);
      await api.post('/purchase-orders', {
        supplierId: selectedSupplier,
        items: parsedItems,
        discount: Number(orderDiscount) || 0,
        adjustment: Number(orderAdjustment) || 0,
        notes: notes || null,
      });

      dispatch(
        addToast({
          message: 'Purchase order created successfully.',
          type: 'success',
        })
      );
      router.push('/purchase-orders');
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to create purchase order.',
          type: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const itemsSubtotal = calculateTotal();
  const orderTotal = Math.max(0, itemsSubtotal - (Number(orderDiscount) || 0) + (Number(orderAdjustment) || 0));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/purchase-orders" className="hover:text-white transition-colors flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to list
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Create Purchase Order</h1>
        <p className="text-sm text-gray-400">Assemble dynamic item lists and submit procurement orders</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#11131e] border border-[#22263f] p-8 rounded-2xl shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supplier Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Supplier
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
            >
              <option value="">Choose Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.supplierName} (Lead Time: {s.avgLeadTimeDays}-{s.maxLeadTimeDays} days)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PO Items List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#22263f] pb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Order Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/30 rounded-lg text-xs font-semibold flex items-center transition-colors"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Product Select */}
                <div className="flex-1">
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="w-full md:w-28">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-xs text-white focus:outline-none text-center"
                    placeholder="Qty"
                  />
                </div>

                {/* Unit Cost Price */}
                <div className="w-full md:w-36">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-xs pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-xs text-white focus:outline-none text-right"
                      placeholder="Unit Cost"
                    />
                  </div>
                </div>

                {/* Line Total */}
                <div className="w-full md:w-36 flex items-center justify-between md:justify-end px-3 py-2 md:py-0 bg-[#0d0e15] md:bg-transparent rounded-xl border border-[#22263f]/40 md:border-none">
                  <span className="text-xs text-gray-500 md:hidden">Subtotal:</span>
                  <span className="text-sm font-semibold text-white font-mono">
                    ₹{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length <= 1}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 rounded-xl transition-all self-end md:self-auto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PO Total & Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#22263f]">
          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Purchase Order Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
              placeholder="e.g. Expedited shipping requested, pricing negotiated..."
            />
          </div>

          {/* Pricing Summary Card */}
          <div className="bg-[#141725] border border-[#22263f] p-5 rounded-2xl space-y-3 h-fit">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Items Subtotal</span>
              <span className="font-mono">₹{itemsSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Flat Order Discount */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Order Discount (Flat)</span>
              <div className="relative w-28">
                <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500 text-[10px] pointer-events-none">₹</span>
                <input
                  type="number"
                  value={orderDiscount}
                  onChange={(e) => setOrderDiscount(e.target.value === '' ? '' as any : parseFloat(e.target.value) || 0)}
                  className="w-full pl-5 pr-2 py-1 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-lg text-xs text-white focus:outline-none text-right font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Flat Order Adjustment */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Other Adjustment (+/-)</span>
              <div className="relative w-28">
                <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500 text-[10px] pointer-events-none">₹</span>
                <input
                  type="number"
                  value={orderAdjustment}
                  onChange={(e) => setOrderAdjustment(e.target.value === '' ? '' as any : parseFloat(e.target.value) || 0)}
                  className="w-full pl-5 pr-2 py-1 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-lg text-xs text-white focus:outline-none text-right font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="border-t border-[#22263f] pt-3 mt-3 flex justify-between items-baseline">
              <span className="font-semibold text-white text-sm">Order Value</span>
              <span className="text-xl font-bold text-white font-mono">
                ₹{orderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {orderTotal > 50000 && (
              <div className="text-[10px] text-amber-400 bg-amber-950/20 border border-amber-500/10 p-2 rounded-xl text-center">
                Requires Management Approval (Total &gt; ₹50,000)
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-[#22263f]">
          <Link
            href="/purchase-orders"
            className="px-4 py-2 bg-[#171926] hover:bg-[#1f2235] border border-[#2c324e] rounded-xl text-sm font-medium text-gray-300 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow shadow-blue-500/20 flex items-center"
          >
            {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
            Submit Order
          </button>
        </div>
      </form>
    </div>
  );
}
