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
import { Edit2, Trash2, Loader2, Home, MapPin } from 'lucide-react';
import { RoleGuard } from '../../../components/auth/RoleGuard';

const warehouseSchema = z.object({
  warehouseName: z.string().min(1, 'Warehouse name is required').max(200),
  location: z.string().min(1, 'Location is required').max(500),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

export default function WarehousesPage() {
  const dispatch = useAppDispatch();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
  });

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warehouses');
      setWarehouses(res.data.data);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to fetch warehouses list.',
          type: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const onSubmit = async (values: WarehouseFormValues) => {
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/warehouses/${editingId}`, values);
        dispatch(addToast({ message: 'Warehouse updated successfully.', type: 'success' }));
      } else {
        await api.post('/warehouses', values);
        dispatch(addToast({ message: 'Warehouse created successfully.', type: 'success' }));
      }
      reset();
      setEditingId(null);
      fetchWarehouses();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to save warehouse.',
          type: 'error',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (warehouse: any) => {
    setEditingId(warehouse.id);
    setValue('warehouseName', warehouse.warehouseName);
    setValue('location', warehouse.location);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this warehouse?')) return;

    try {
      await api.delete(`/warehouses/${id}`);
      dispatch(
        addToast({
          message: 'Warehouse deactivated successfully.',
          type: 'success',
        })
      );
      fetchWarehouses();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to deactivate warehouse.',
          type: 'error',
        })
      );
    }
  };

  const columns = [
    {
      header: 'Warehouse Name',
      accessor: (row: any) => (
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-[#171926] border border-[#2c324e] rounded-xl text-blue-400">
            <Home className="h-4 w-4" />
          </div>
          <span className="font-semibold text-white">{row.warehouseName}</span>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: (row: any) => (
        <div className="flex items-center space-x-1.5 text-gray-400">
          <MapPin className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
          <span className="truncate max-w-xs">{row.location}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <Badge color={row.isActive ? 'emerald' : 'gray'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center space-x-2">
          <RoleGuard permission="MANAGE_WAREHOUSES">
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Edit Warehouse"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
              title="Deactivate Warehouse"
              disabled={!row.isActive}
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
        <h1 className="text-2xl font-bold text-white tracking-tight">Warehouse management</h1>
        <p className="text-sm text-gray-400">Add and manage physical storage sites for inventory stock</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouses list */}
        <div className="lg:col-span-2 h-[calc(100vh-200px)]">
          <DataTable columns={columns} data={warehouses} loading={loading} />
        </div>

        {/* Create/Edit warehouse form */}
        <RoleGuard permission="MANAGE_WAREHOUSES">
          <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl h-fit">
            <h3 className="text-base font-semibold text-white tracking-tight mb-4">
              {editingId ? 'Edit Warehouse' : 'Create Warehouse'}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Warehouse Name
                </label>
                <input
                  type="text"
                  {...register('warehouseName')}
                  className={`w-full px-4 py-2.5 bg-[#0d0e15] border ${
                    errors.warehouseName
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-[#22263f] focus:border-blue-500'
                  } rounded-xl text-sm text-white focus:outline-none transition-colors`}
                  placeholder="e.g. Mumbai Fulfillment Center"
                />
                {errors.warehouseName && (
                  <p className="text-xs text-red-500 mt-1">{errors.warehouseName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Location Address
                </label>
                <textarea
                  rows={3}
                  {...register('location')}
                  className={`w-full px-4 py-2.5 bg-[#0d0e15] border ${
                    errors.location
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-[#22263f] focus:border-blue-500'
                  } rounded-xl text-sm text-white focus:outline-none transition-colors`}
                  placeholder="e.g. Aisle 5, Sector 12, Kalamboli, Navi Mumbai"
                />
                {errors.location && (
                  <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow shadow-blue-500/20 flex items-center justify-center"
                >
                  {saving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  {editingId ? 'Save Changes' : 'Create Warehouse'}
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
