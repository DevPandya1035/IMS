'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAppDispatch } from '../../../store/hooks';
import { addToast } from '../../../store/slices/toastSlice';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard, usePermission } from '../../../components/auth/RoleGuard';

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const { checkPermission } = usePermission();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products', {
        params: {
          page,
          limit: 10,
          search: searchQuery,
          categoryId: selectedCategory || undefined,
          sort: sortField,
          order: sortOrder,
          isActive: 'true',
        },
      });

      setProducts(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to fetch products list.',
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

  useEffect(() => {
    fetchProducts();
  }, [page, searchQuery, selectedCategory, sortField, sortOrder]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this product?')) return;

    try {
      await api.delete(`/products/${id}`);
      dispatch(
        addToast({
          message: 'Product deactivated successfully.',
          type: 'success',
        })
      );
      fetchProducts();
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.response?.data?.error || 'Failed to deactivate product.',
          type: 'error',
        })
      );
    }
  };

  const columns = [
    {
      header: 'SKU / Barcode',
      accessor: (row: any) => (
        <div>
          <span className="font-mono text-xs font-semibold text-gray-300">{row.sku}</span>
          {row.barcode && <span className="block text-[10px] text-gray-500 font-mono">BC: {row.barcode}</span>}
        </div>
      ),
      sortable: true,
      key: 'sku',
    },
    {
      header: 'Product Name',
      accessor: (row: any) => (
        <div>
          <span className="font-semibold text-white">{row.name}</span>
          <span className="block text-xs text-gray-500 max-w-xs truncate">{row.description}</span>
        </div>
      ),
      sortable: true,
      key: 'name',
    },
    {
      header: 'Category',
      accessor: (row: any) => <Badge color="violet">{row.category.categoryName}</Badge>,
    },
    {
      header: 'Price',
      accessor: (row: any) => (
        <div>
          <span className="font-semibold text-white">₹{Number(row.price).toLocaleString('en-IN')}</span>
          {row.costPrice && (
            <span className="block text-[10px] text-gray-500">
              Cost: ₹{Number(row.costPrice).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      ),
      sortable: true,
      key: 'price',
    },
    {
      header: 'Stock Level',
      accessor: (row: any) => {
        const isLow = row.quantity <= row.reorderLevel;
        return (
          <div className="flex items-center space-x-2">
            <span className={`font-semibold ${isLow ? 'text-amber-500' : 'text-white'}`}>
              {row.quantity} units
            </span>
            {isLow && (
              <Badge color="amber">
                <ShieldAlert className="h-3 w-3 mr-1" />
                Low
              </Badge>
            )}
          </div>
        );
      },
      sortable: true,
      key: 'quantity',
    },
    {
      header: 'Expiry Date',
      accessor: (row: any) =>
        row.expiryDate ? (
          <span className="text-xs text-gray-400">
            {new Date(row.expiryDate).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        ),
      sortable: true,
      key: 'expiryDate',
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center space-x-2">
          <RoleGuard permission="UPDATE_PRODUCT">
            <Link
              href={`/products/${row.id}`}
              className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Edit Product"
            >
              <Edit2 className="h-4 w-4" />
            </Link>
          </RoleGuard>
          <RoleGuard permission="DELETE_PRODUCT">
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
              title="Deactivate Product"
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
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Products catalog</h1>
          <p className="text-sm text-gray-400">View, search, and manage your inventory products catalog</p>
        </div>
        <RoleGuard permission="CREATE_PRODUCT">
          <Link
            href="/products/new"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow shadow-blue-500/20 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </RoleGuard>
      </div>

      {/* Categories filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            setSelectedCategory('');
            setPage(1);
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            selectedCategory === ''
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'border-[#22263f] bg-[#11131e] text-gray-400 hover:text-white hover:border-gray-600'
          }`}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSelectedCategory(c.id);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedCategory === c.id
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'border-[#22263f] bg-[#11131e] text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {c.categoryName} ({c._count.products})
          </button>
        ))}
      </div>

      {/* Main product data grid */}
      <div className="h-[calc(100vh-270px)]">
        <DataTable
          columns={columns}
          data={products}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setPage(1);
          }}
          onSortChange={(field, order) => {
            setSortField(field);
            setSortOrder(order);
          }}
          pagination={{
            page,
            totalPages,
            limit: 10,
            total,
            onPageChange: (p) => setPage(p),
          }}
        />
      </div>
    </div>
  );
}
