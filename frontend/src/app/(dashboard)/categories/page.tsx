'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../../lib/api';
import { useAppDispatch } from '../../../store/hooks';
import { addToast } from '../../../store/slices/toastSlice';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Plus, Edit2, Trash2, Loader2, Sparkles } from 'lucide-react';
import { RoleGuard } from '../../../components/auth/RoleGuard';

const categorySchema = z.object({
  categoryName: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional().nullable(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to fetch categories.',
          type: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      setSaving(true);
      const payload = {
        ...values,
        description: values.description || null,
      };

      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
        dispatch(addToast({ message: 'Category updated successfully.', type: 'success' }));
      } else {
        await api.post('/categories', payload);
        dispatch(addToast({ message: 'Category created successfully.', type: 'success' }));
      }
      reset();
      setEditingId(null);
      fetchCategories();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to save category.',
          type: 'error',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setValue('categoryName', category.categoryName);
    setValue('description', category.description || '');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this category?')) return;

    try {
      await api.delete(`/categories/${id}`);
      dispatch(
        addToast({
          message: 'Category deactivated successfully.',
          type: 'success',
        })
      );
      fetchCategories();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to delete category.',
          type: 'error',
        })
      );
    }
  };

  const columns = [
    {
      header: 'Category Name',
      accessor: (row: any) => <span className="font-semibold text-white">{row.categoryName}</span>,
    },
    {
      header: 'Description',
      accessor: (row: any) => (
        <span className="text-gray-400 max-w-xs truncate block">{row.description || '—'}</span>
      ),
    },
    {
      header: 'Products Count',
      accessor: (row: any) => <Badge color="blue">{row._count?.products || 0} items</Badge>,
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center space-x-2">
          <RoleGuard permission="MANAGE_CATEGORIES">
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Edit Category"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
              title="Deactivate Category"
              disabled={row._count?.products > 0}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </RoleGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Category management</h1>
        <p className="text-sm text-gray-400">Classify products into logical groups for catalogs and reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="lg:col-span-2 h-[calc(100vh-200px)]">
          <DataTable columns={columns} data={categories} loading={loading} />
        </div>

        {/* Category Creation Form */}
        <RoleGuard permission="MANAGE_CATEGORIES">
          <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl h-fit">
            <h3 className="text-base font-semibold text-white tracking-tight mb-4 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-indigo-400" />
              {editingId ? 'Edit Category' : 'Create Category'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  {...register('categoryName')}
                  className={`w-full px-4 py-2 bg-[#0d0e15] border ${
                    errors.categoryName
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-[#22263f] focus:border-blue-500'
                  } rounded-xl text-sm text-white focus:outline-none transition-colors`}
                  placeholder="e.g. Electronics"
                />
                {errors.categoryName && (
                  <p className="text-xs text-red-500 mt-1">{errors.categoryName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  {...register('description')}
                  className="w-full px-4 py-2 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none transition-colors"
                  placeholder="Enter category description..."
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow shadow-blue-500/20 flex items-center justify-center"
                >
                  {saving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  {editingId ? 'Save Changes' : 'Create Category'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setEditingId(null);
                    }}
                    className="px-4 py-2.5 bg-[#171926] hover:bg-[#1f2235] border border-[#2c324e] rounded-xl text-sm font-medium text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </RoleGuard>
      </div>
    </div>
  );
}
