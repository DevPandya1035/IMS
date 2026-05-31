import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  sku: z.string().min(1, 'SKU is required').max(50),
  barcode: z.string().max(50).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().positive('Price must be positive'),
  costPrice: z.number().positive().optional().nullable(),
  reorderLevel: z.number().int().min(0).default(10),
  categoryId: z.string().min(1, 'Valid category ID is required'),
  supplierId: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  expiryDate: z.string().datetime().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  categoryName: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createSupplierSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required').max(200),
  contactPerson: z.string().max(100).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  avgLeadTimeDays: z.number().int().min(1).default(7),
  maxLeadTimeDays: z.number().int().min(1).default(14),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
