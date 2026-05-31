'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProductForm } from '../../../../components/products/ProductForm';

export default function NewProductPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Add new product</h1>
        <p className="text-sm text-gray-400">Register a new product in the catalog with automatic SKU safety checks</p>
      </div>

      <ProductForm
        onSubmitSuccess={() => router.push('/products')}
        onCancel={() => router.push('/products')}
      />
    </div>
  );
}
