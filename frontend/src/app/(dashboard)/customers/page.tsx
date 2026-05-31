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
import { Edit2, Trash2, Loader2, User, Mail, Phone, MapPin, Percent } from 'lucide-react';
import { RoleGuard } from '../../../components/auth/RoleGuard';

const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  email: z.string().email('Please enter a valid email address').or(z.literal('')).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  gstin: z.string().max(15).optional().nullable(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const dispatch = useAppDispatch();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data.data);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to fetch customers.',
          type: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      setSaving(true);
      const payload = {
        ...values,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
        gstin: values.gstin || null,
      };

      if (editingId) {
        await api.put(`/customers/${editingId}`, payload);
        dispatch(addToast({ message: 'Customer updated successfully.', type: 'success' }));
      } else {
        await api.post('/customers', payload);
        dispatch(addToast({ message: 'Customer created successfully.', type: 'success' }));
      }
      reset();
      setEditingId(null);
      fetchCustomers();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to save customer.',
          type: 'error',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (customer: any) => {
    setEditingId(customer.id);
    setValue('name', customer.name);
    setValue('email', customer.email || '');
    setValue('phone', customer.phone || '');
    setValue('address', customer.address || '');
    setValue('gstin', customer.gstin || '');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this customer?')) return;

    try {
      await api.delete(`/customers/${id}`);
      dispatch(
        addToast({
          message: 'Customer deactivated successfully.',
          type: 'success',
        })
      );
      fetchCustomers();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to deactivate customer.',
          type: 'error',
        })
      );
    }
  };

  const columns = [
    {
      header: 'Customer Name',
      accessor: (row: any) => (
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-[#171926] border border-[#2c324e] rounded-xl text-blue-400">
            <User className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-white">{row.name}</span>
            {row.gstin && (
              <span className="block text-[10px] text-gray-500 font-mono">GSTIN: {row.gstin}</span>
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
      header: 'Billing Address',
      accessor: (row: any) => (
        <div className="flex items-center space-x-1.5 text-xs text-gray-400">
          <MapPin className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
          <span className="truncate max-w-xs">{row.address || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Orders',
      accessor: (row: any) => <Badge color="emerald">{row._count?.salesOrders || 0} orders</Badge>,
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center space-x-2">
          <RoleGuard permission="CREATE_SO">
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Edit Customer"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
              title="Deactivate Customer"
              disabled={row._count?.salesOrders > 0}
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
        <h1 className="text-2xl font-bold text-white tracking-tight">Customers management</h1>
        <p className="text-sm text-gray-400">Manage client profiles, contact data, and GST registration tax configurations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customers list */}
        <div className="lg:col-span-2 h-[calc(100vh-200px)]">
          <DataTable columns={columns} data={customers} loading={loading} />
        </div>

        {/* Create/Edit card form */}
        <RoleGuard permission="CREATE_SO">
          <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl h-fit">
            <h3 className="text-base font-semibold text-white tracking-tight mb-4">
              {editingId ? 'Edit Customer' : 'Create Customer'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full px-4 py-2.5 bg-[#0d0e15] border ${
                    errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-[#22263f] focus:border-blue-500'
                  } rounded-xl text-sm text-white focus:outline-none transition-colors`}
                  placeholder="e.g. Reliance Retail"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Email Address
                </label>
                <input
                  type="text"
                  {...register('email')}
                  className={`w-full px-4 py-2.5 bg-[#0d0e15] border ${
                    errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-[#22263f] focus:border-blue-500'
                  } rounded-xl text-sm text-white focus:outline-none`}
                  placeholder="e.g. accounts@reliance.com"
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
                  placeholder="e.g. +91 99999 88888"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  GSTIN (15-character ID)
                </label>
                <input
                  type="text"
                  {...register('gstin')}
                  className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none font-mono"
                  placeholder="e.g. 27AAAAA1111A1Z1"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  {...register('address')}
                  className="w-full px-4 py-2.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
                  placeholder="Enter full billing address..."
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow shadow-blue-500/20 flex items-center justify-center"
                >
                  {saving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  {editingId ? 'Save Changes' : 'Create Customer'}
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
