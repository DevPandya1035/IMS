'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAppDispatch } from '../../../../store/hooks';
import { addToast } from '../../../../store/slices/toastSlice';
import { Trash2, Plus, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SOItem {
  productId: string;
  productName: string;
  quantity: number | '';
  unitPrice: number | '';
  discount: number | '';
}

export default function NewSalesOrderPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form states
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [items, setItems] = useState<SOItem[]>([
    { productId: '', productName: '', quantity: 1, unitPrice: 0, discount: 0 },
  ]);
  const [notes, setNotes] = useState('');
  const [orderDiscount, setOrderDiscount] = useState<number | ''>(0);
  const [orderAdjustment, setOrderAdjustment] = useState<number | ''>(0);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setFetching(true);
        const [custRes, wareRes, prodRes] = await Promise.all([
          api.get('/customers'),
          api.get('/warehouses'),
          api.get('/products', { params: { limit: 1000, isActive: 'true' } }),
        ]);
        setCustomers(custRes.data.data);
        setWarehouses(wareRes.data.data);
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

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
    if (customerId) {
      const cust = customers.find((c) => c.id === customerId);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerEmail(cust.email || '');
        setCustomerPhone(cust.phone || '');
      }
    } else {
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { productId: '', productName: '', quantity: 1, unitPrice: 0, discount: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof SOItem, value: any) => {
    setItems((prev) => {
      const nextItems = [...prev];
      const item = { ...nextItems[index]! };

      if (field === 'productId') {
        item.productId = value;
        const prod = products.find((p) => p.id === value);
        if (prod) {
          item.productName = prod.name;
          item.unitPrice = Number(prod.price || 0);
        } else {
          item.productName = '';
          item.unitPrice = 0;
        }
      } else if (field === 'quantity') {
        item.quantity = value === '' ? '' : Math.max(0, parseInt(value) || 0);
      } else if (field === 'unitPrice') {
        item.unitPrice = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
      } else if (field === 'discount') {
        item.discount = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
      }

      nextItems[index] = item;
      return nextItems;
    });
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  };

  const calculateDiscountTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0)), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName) {
      dispatch(addToast({ message: 'Customer name is required.', type: 'error' }));
      return;
    }
    if (!selectedWarehouse) {
      dispatch(addToast({ message: 'Please select a source warehouse.', type: 'error' }));
      return;
    }

    const parsedItems = items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      discount: Number(item.discount) || 0,
    }));

    const invalidItem = parsedItems.some((item) => !item.productId || item.quantity <= 0 || item.unitPrice < 0);
    if (invalidItem) {
      dispatch(addToast({ message: 'Please complete all items with valid products, quantities, and prices.', type: 'error' }));
      return;
    }

    try {
      setLoading(true);
      await api.post('/sales-orders', {
        customerId: selectedCustomer || null,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        warehouseId: selectedWarehouse,
        items: parsedItems,
        discount: Number(orderDiscount) || 0,
        adjustment: Number(orderAdjustment) || 0,
        notes: notes || null,
      });

      dispatch(
        addToast({
          message: 'Sales order created successfully.',
          type: 'success',
        })
      );
      router.push('/sales');
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to create sales order.',
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

  const subtotal = calculateSubtotal();
  const discounts = calculateDiscountTotal();
  const orderTotal = Math.max(0, subtotal - discounts - (Number(orderDiscount) || 0) + (Number(orderAdjustment) || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/sales" className="hover:text-white transition-colors flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to list
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Create Sales Order</h1>
        <p className="text-sm text-gray-400">Record customer orders and allocate stock from warehouses</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#11131e] border border-[#22263f] p-8 rounded-2xl shadow-xl">
        {/* Customer & Warehouse Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Select Client Profile (Optional)
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
            >
              <option value="">One-off / New Client</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Client Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
              placeholder="e.g. Reliance Retail"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Source Warehouse
            </label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.warehouseName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Client Email (Optional)
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
              placeholder="e.g. billing@reliance.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Client Phone (Optional)
            </label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
              placeholder="e.g. +91 99999 88888"
            />
          </div>
        </div>

        {/* Order Items */}
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
                        {p.name} ({p.sku}) — Available: {p.quantity} units
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="w-full md:w-24">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-xs text-white focus:outline-none text-center"
                    placeholder="Qty"
                  />
                </div>

                {/* Unit Price */}
                <div className="w-full md:w-32">
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
                      placeholder="Price"
                    />
                  </div>
                </div>

                {/* Discount */}
                <div className="w-full md:w-28">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-xs pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-xs text-white focus:outline-none text-right"
                      placeholder="Discount"
                    />
                  </div>
                </div>

                {/* Subtotal */}
                <div className="w-full md:w-36 flex items-center justify-between md:justify-end px-3 py-2 md:py-0 bg-[#0d0e15] md:bg-transparent rounded-xl border border-[#22263f]/40 md:border-none">
                  <span className="text-xs text-gray-500 md:hidden">Subtotal:</span>
                  <span className="text-sm font-semibold text-white font-mono">
                    ₹{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

        {/* Totals & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#22263f]">
          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Sales Order Notes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
              placeholder="e.g. Dispatch to dock 4, payment terms Net-30..."
            />
          </div>

          {/* Pricing summary */}
          <div className="bg-[#141725] border border-[#22263f] p-5 rounded-2xl space-y-3 h-fit">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Items Total</span>
              <span className="font-mono">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs text-red-400">
              <span>Items Discount</span>
              <span className="font-mono">-₹{discounts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-[#22263f]">
          <Link
            href="/sales"
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
