'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/toastSlice';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeftRight, ArrowDown, ArrowUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const adjustmentFormSchema = z.object({
  type: z.enum(['STOCK_IN', 'STOCK_OUT', 'TRANSFER']),
  productId: z.string().min(1, 'Please select a valid product'),
  quantity: z.coerce.number().int().positive('Quantity must be a positive integer'),
  warehouseId: z.string().optional().nullable().or(z.literal('')),
  fromWarehouseId: z.string().optional().nullable().or(z.literal('')),
  toWarehouseId: z.string().optional().nullable().or(z.literal('')),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

export default function StockAdjustmentPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema) as any,
    defaultValues: {
      type: 'STOCK_IN',
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setFetchingOptions(true);
        // Fetch all products (limit large to search)
        const [prodRes, wareRes] = await Promise.all([
          api.get('/products', { params: { limit: 1000, isActive: 'true' } }),
          api.get('/warehouses'),
        ]);
        setProducts(prodRes.data.data);
        setWarehouses(wareRes.data.data);
      } catch (err) {
        dispatch(
          addToast({
            message: 'Failed to fetch options data.',
            type: 'error',
          })
        );
      } finally {
        setFetchingOptions(false);
      }
    };
    fetchOptions();
  }, [dispatch]);

  const onSubmit = async (values: any) => {
    try {
      setLoading(true);

      if (values.type === 'STOCK_IN') {
        if (!values.warehouseId) {
          dispatch(addToast({ message: 'Warehouse is required.', type: 'error' }));
          setLoading(false);
          return;
        }
        await api.post('/inventory/stock-in', {
          productId: values.productId,
          quantity: values.quantity,
          warehouseId: values.warehouseId,
          reference: values.reference || null,
          notes: values.notes || null,
        });
      } else if (values.type === 'STOCK_OUT') {
        if (!values.warehouseId) {
          dispatch(addToast({ message: 'Warehouse is required.', type: 'error' }));
          setLoading(false);
          return;
        }
        await api.post('/inventory/stock-out', {
          productId: values.productId,
          quantity: values.quantity,
          warehouseId: values.warehouseId,
          reference: values.reference || null,
          notes: values.notes || null,
        });
      } else {
        // TRANSFER
        if (!values.fromWarehouseId || !values.toWarehouseId) {
          dispatch(addToast({ message: 'Both source and destination warehouses are required.', type: 'error' }));
          setLoading(false);
          return;
        }
        await api.post('/inventory/transfer', {
          productId: values.productId,
          quantity: values.quantity,
          fromWarehouseId: values.fromWarehouseId,
          toWarehouseId: values.toWarehouseId,
          notes: values.notes || null,
        });
      }

      dispatch(
        addToast({
          message: 'Inventory stock adjusted successfully.',
          type: 'success',
        })
      );
      router.push('/inventory');
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to adjust inventory.',
          type: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchingOptions) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/inventory" className="hover:text-white transition-colors flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to levels
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Stock adjustment</h1>
        <p className="text-sm text-gray-400">Add, remove, or transfer product stock quantities directly</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-[#11131e] border border-[#22263f] p-8 rounded-2xl shadow-xl">
        {/* Adjustment Type Switcher */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Operation Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setValue('type', 'STOCK_IN')}
              className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                selectedType === 'STOCK_IN'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-[#22263f] bg-[#0d0e15] text-gray-400 hover:text-white'
              }`}
            >
              <ArrowDown className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-semibold">Stock In</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'STOCK_OUT')}
              className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                selectedType === 'STOCK_OUT'
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-[#22263f] bg-[#0d0e15] text-gray-400 hover:text-white'
              }`}
            >
              <ArrowUp className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-semibold">Stock Out</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'TRANSFER')}
              className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                selectedType === 'TRANSFER'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-[#22263f] bg-[#0d0e15] text-gray-400 hover:text-white'
              }`}
            >
              <ArrowLeftRight className="h-5 w-5 mb-1.5" />
              <span className="text-xs font-semibold">Transfer Stock</span>
            </button>
          </div>
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Select Product
          </label>
          <select
            {...register('productId')}
            className={`w-full px-4 py-2.5 bg-[#0d0e15] border ${
              errors.productId ? 'border-red-500/50 focus:border-red-500' : 'border-[#22263f] focus:border-blue-500'
            } rounded-xl text-sm text-white focus:outline-none transition-colors`}
          >
            <option value="">Choose a Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) — Available: {p.quantity} units
              </option>
            ))}
          </select>
          {errors.productId && <p className="text-xs text-red-500 mt-1">{errors.productId.message}</p>}
        </div>

        {/* Dynamic Warehouse Selections */}
        {selectedType === 'TRANSFER' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Source Warehouse
              </label>
              <select
                {...register('fromWarehouseId')}
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
                Destination Warehouse
              </label>
              <select
                {...register('toWarehouseId')}
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
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Warehouse
            </label>
            <select
              {...register('warehouseId')}
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
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Quantity (Units)
            </label>
            <input
              type="number"
              {...register('quantity')}
              className={`w-full px-4 py-2.5 bg-[#0d0e15] border ${
                errors.quantity ? 'border-red-500/50 focus:border-red-500' : 'border-[#22263f] focus:border-blue-500'
              } rounded-xl text-sm text-white focus:outline-none`}
              placeholder="e.g. 50"
            />
            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
          </div>

          {/* Reference */}
          {selectedType !== 'TRANSFER' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Reference Code (Optional)
              </label>
              <input
                type="text"
                {...register('reference')}
                className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
                placeholder="e.g. GRN-1025, SALE-2201"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Notes
          </label>
          <textarea
            rows={3}
            {...register('notes')}
            className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
            placeholder="Reason for adjustment, e.g. Damaged goods, inventory count discrepancy..."
          />
        </div>

        <div className="flex items-center justify-end space-x-3 border-t border-[#22263f] pt-6">
          <Link
            href="/inventory"
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
            Confirm Adjustment
          </button>
        </div>
      </form>
    </div>
  );
}
