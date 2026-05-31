'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../lib/api';
import { useAppDispatch } from '../../store/hooks';
import { addToast } from '../../store/slices/toastSlice';
import { Loader2 } from 'lucide-react';

const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  sku: z.string().min(1, 'SKU code is required').max(50),
  barcode: z.string().max(50).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  price: z.coerce.number().positive('Price must be positive'),
  costPrice: z.coerce.number().positive().optional().nullable(),
  reorderLevel: z.coerce.number().int().min(0).default(10),
  categoryId: z.string().min(1, 'Please select a valid category'),
  supplierId: z.string().optional().nullable().or(z.literal('')),
  expiryDate: z.string().optional().nullable(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialValues?: any;
  onSubmitSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ initialValues, onSubmitSuccess, onCancel }: ProductFormProps) {
  const dispatch = useAppDispatch();
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: initialValues
      ? {
          name: initialValues.name,
          sku: initialValues.sku,
          barcode: initialValues.barcode || '',
          description: initialValues.description || '',
          price: initialValues.price,
          costPrice: initialValues.costPrice || '',
          reorderLevel: initialValues.reorderLevel || 10,
          categoryId: initialValues.categoryId,
          supplierId: initialValues.supplierId || '',
          expiryDate: initialValues.expiryDate ? new Date(initialValues.expiryDate).toISOString().slice(0, 10) : '',
        }
      : {
          reorderLevel: 10,
        },
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setFetchingOptions(true);
        const [catRes, supRes] = await Promise.all([
          api.get('/categories'),
          api.get('/suppliers'),
        ]);
        setCategories(catRes.data.data);
        setSuppliers(supRes.data.data);
      } catch (err) {
        dispatch(
          addToast({
            message: 'Failed to load form lookup data.',
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
      // Clean nullable parameters
      const payload = {
        ...values,
        barcode: values.barcode || null,
        description: values.description || null,
        costPrice: values.costPrice || null,
        supplierId: values.supplierId || null,
        expiryDate: values.expiryDate ? new Date(values.expiryDate).toISOString() : null,
      };

      if (initialValues?.id) {
        await api.put(`/products/${initialValues.id}`, payload);
        dispatch(addToast({ message: 'Product updated successfully.', type: 'success' }));
      } else {
        await api.post('/products', payload);
        dispatch(addToast({ message: 'Product created successfully.', type: 'success' }));
      }
      onSubmitSuccess();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to save product.',
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl bg-[#11131e] border border-[#22263f] p-8 rounded-2xl shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Product Name
          </label>
          <input
            type="text"
            {...register('name')}
            className={`w-full px-4 py-2.5 bg-[#0d0e15] border ${
              errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-[#22263f] focus:border-blue-500'
            } rounded-xl text-sm text-white focus:outline-none transition-colors`}
            placeholder="e.g. Wireless Mouse"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        {/* SKU */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            SKU Code
          </label>
          <input
            type="text"
            {...register('sku')}
            className={`w-full px-4 py-2.5 bg-[#0d0e15] border ${
              errors.sku ? 'border-red-500/50 focus:border-red-500' : 'border-[#22263f] focus:border-blue-500'
            } rounded-xl text-sm text-white focus:outline-none transition-colors`}
            placeholder="e.g. WRLS-MSE-01"
            disabled={!!initialValues}
          />
          {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>}
        </div>

        {/* Barcode */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Barcode (UPC/EAN)
          </label>
          <input
            type="text"
            {...register('barcode')}
            className={`w-full px-4 py-2.5 bg-[#0d0e15] border ${
              errors.barcode ? 'border-red-500/50 focus:border-red-500' : 'border-[#22263f] focus:border-blue-500'
            } rounded-xl text-sm text-white focus:outline-none transition-colors`}
            placeholder="e.g. 123456789012"
          />
          {errors.barcode && <p className="text-xs text-red-500 mt-1">{errors.barcode.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Category
          </label>
          <select
            {...register('categoryId')}
            className={`w-full px-4 py-2.5 bg-[#0d0e15] border ${
              errors.categoryId ? 'border-red-500/50 focus:border-red-500' : 'border-[#22263f] focus:border-blue-500'
            } rounded-xl text-sm text-white focus:outline-none transition-colors`}
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.categoryName}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Supplier (Optional)
          </label>
          <select
            {...register('supplierId')}
            className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none transition-colors"
          >
            <option value="">Select Supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.supplierName}
              </option>
            ))}
          </select>
        </div>

        {/* Retail Price */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Retail Price (INR)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('price')}
            className={`w-full px-4 py-2.5 bg-[#0d0e15] border ${
              errors.price ? 'border-red-500/50 focus:border-red-500' : 'border-[#22263f] focus:border-blue-500'
            } rounded-xl text-sm text-white focus:outline-none transition-colors`}
            placeholder="0.00"
          />
          {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
        </div>

        {/* Cost Price */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Cost Price (INR)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('costPrice')}
            className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none transition-colors"
            placeholder="0.00"
          />
        </div>

        {/* Reorder Level */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Reorder Level (Units)
          </label>
          <input
            type="number"
            {...register('reorderLevel')}
            className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none transition-colors"
            placeholder="10"
          />
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Expiry Date (Optional)
          </label>
          <input
            type="date"
            {...register('expiryDate')}
            className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none transition-colors"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Product Description
          </label>
          <textarea
            rows={4}
            {...register('description')}
            className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none transition-colors"
            placeholder="Enter product details..."
          />
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 border-t border-[#22263f] pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-[#171926] hover:bg-[#1f2235] border border-[#2c324e] rounded-xl text-sm font-medium text-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow shadow-blue-500/20 flex items-center"
        >
          {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
          {initialValues ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
export default ProductForm;
