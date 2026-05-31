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
import { Edit2, Trash2, Loader2, Truck, User, Mail, Phone, Clock } from 'lucide-react';
import { RoleGuard } from '../../../components/auth/RoleGuard';

const supplierSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required').max(200),
  contactPerson: z.string().max(100).optional().nullable(),
  email: z.string().email('Please enter a valid email address').or(z.literal('')).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  avgLeadTimeDays: z.coerce.number().int().min(1).default(7),
  maxLeadTimeDays: z.coerce.number().int().min(1).default(14),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
  const dispatch = useAppDispatch();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: {
      avgLeadTimeDays: 7,
      maxLeadTimeDays: 14,
    },
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers');
      setSuppliers(res.data.data);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to fetch suppliers.',
          type: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const onSubmit = async (values: any) => {
    try {
      setSaving(true);
      const payload = {
        ...values,
        contactPerson: values.contactPerson || null,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
      };

      if (editingId) {
        await api.put(`/suppliers/${editingId}`, payload);
        dispatch(addToast({ message: 'Supplier updated successfully.', type: 'success' }));
      } else {
        await api.post('/suppliers', payload);
        dispatch(addToast({ message: 'Supplier created successfully.', type: 'success' }));
      }
      reset();
      setEditingId(null);
      fetchSuppliers();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to save supplier.',
          type: 'error',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingId(supplier.id);
    setValue('supplierName', supplier.supplierName);
    setValue('contactPerson', supplier.contactPerson || '');
    setValue('email', supplier.email || '');
    setValue('phone', supplier.phone || '');
    setValue('address', supplier.address || '');
    setValue('avgLeadTimeDays', supplier.avgLeadTimeDays);
    setValue('maxLeadTimeDays', supplier.maxLeadTimeDays);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this supplier?')) return;

    try {
      await api.delete(`/suppliers/${id}`);
      dispatch(
        addToast({
          message: 'Supplier deactivated successfully.',
          type: 'success',
        })
      );
      fetchSuppliers();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to delete supplier.',
          type: 'error',
        })
      );
    }
  };

  const columns = [
    {
      header: 'Supplier Name',
      accessor: (row: any) => (
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-[#171926] border border-[#2c324e] rounded-xl text-blue-400">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-white">{row.supplierName}</span>
            {row.contactPerson && (
              <span className="block text-[10px] text-gray-500">Contact: {row.contactPerson}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Details',
      accessor: (row: any) => (
        <div className="space-y-0.5 text-xs text-gray-400">
          {row.email && (
            <div className="flex items-center space-x-1">
              <Mail className="h-3.5 w-3.5 text-gray-500" />
              <span>{row.email}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center space-x-1">
              <Phone className="h-3.5 w-3.5 text-gray-500" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Lead Time',
      accessor: (row: any) => (
        <div className="flex items-center space-x-1.5 text-xs text-gray-400">
          <Clock className="h-3.5 w-3.5 text-gray-500" />
          <span>
            {row.avgLeadTimeDays}-{row.maxLeadTimeDays} days
          </span>
        </div>
      ),
    },
    {
      header: 'Products',
      accessor: (row: any) => <Badge color="violet">{row._count?.products || 0} items</Badge>,
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center space-x-2">
          <RoleGuard permission="CREATE_PO">
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Edit Supplier"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
              title="Deactivate Supplier"
              disabled={row._count?.purchaseOrders > 0}
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
        <h1 className="text-2xl font-bold text-white tracking-tight">Suppliers management</h1>
        <p className="text-sm text-gray-400">Add and manage supplier partners for procurement workflow</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Suppliers list */}
        <div className="lg:col-span-2 h-[calc(100vh-200px)]">
          <DataTable columns={columns} data={suppliers} loading={loading} />
        </div>

        {/* Create/Edit form */}
        <RoleGuard permission="CREATE_PO">
          <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl h-fit">
            <h3 className="text-base font-semibold text-white tracking-tight mb-4">
              {editingId ? 'Edit Supplier' : 'Create Supplier'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Supplier Name
                </label>
                <input
                  type="text"
                  {...register('supplierName')}
                  className={`w-full px-4 py-2.5 bg-[#0d0e15] border ${
                    errors.supplierName
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-[#22263f] focus:border-blue-500'
                  } rounded-xl text-sm text-white focus:outline-none transition-colors`}
                  placeholder="e.g. Acme Tech Corp"
                />
                {errors.supplierName && (
                  <p className="text-xs text-red-500 mt-1">{errors.supplierName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  {...register('contactPerson')}
                  className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Email Address
                </label>
                <input
                  type="text"
                  {...register('email')}
                  className={`w-full px-4 py-2.5 bg-[#0d0e15] border ${
                    errors.email
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-[#22263f] focus:border-blue-500'
                  } rounded-xl text-sm text-white focus:outline-none`}
                  placeholder="e.g. sales@acme.com"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  {...register('phone')}
                  className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Avg Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    {...register('avgLeadTimeDays')}
                    className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
                    placeholder="7"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Max Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    {...register('maxLeadTimeDays')}
                    className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
                    placeholder="14"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Address
                </label>
                <textarea
                  rows={2}
                  {...register('address')}
                  className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
                  placeholder="Enter full supplier address..."
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow shadow-blue-500/20 flex items-center justify-center"
                >
                  {saving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  {editingId ? 'Save Changes' : 'Create Supplier'}
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
