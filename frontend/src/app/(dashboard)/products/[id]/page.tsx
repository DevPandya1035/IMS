'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { ProductForm } from '../../../../components/products/ProductForm';
import { Loader2 } from 'lucide-react';
import { useAppDispatch } from '../../../../store/hooks';
import { addToast } from '../../../../store/slices/toastSlice';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();
  const id = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.data);
      } catch (err: any) {
        dispatch(
          addToast({
            message: 'Failed to fetch product details.',
            type: 'error',
          })
        );
        router.push('/products');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id, router, dispatch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Edit product</h1>
        <p className="text-sm text-gray-400">Modify existing product parameters and restock boundaries</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        product && (
          <ProductForm
            initialValues={product}
            onSubmitSuccess={() => router.push('/products')}
            onCancel={() => router.push('/products')}
          />
        )
      )}
    </div>
  );
}
