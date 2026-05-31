import { z } from 'zod';

export const stockInSchema = z.object({
  productId: z.string().min(1, 'Valid product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  warehouseId: z.string().min(1, 'Valid warehouse ID is required'),
  reference: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const stockOutSchema = z.object({
  productId: z.string().min(1, 'Valid product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  warehouseId: z.string().min(1, 'Valid warehouse ID is required'),
  reference: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const transferSchema = z.object({
  productId: z.string().min(1, 'Valid product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  fromWarehouseId: z.string().min(1, 'Valid source warehouse ID is required'),
  toWarehouseId: z.string().min(1, 'Valid destination warehouse ID is required'),
  notes: z.string().max(500).optional().nullable(),
});

export const createWarehouseSchema = z.object({
  warehouseName: z.string().min(1, 'Warehouse name is required').max(200),
  location: z.string().min(1, 'Location is required').max(500),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export type StockInInput = z.infer<typeof stockInSchema>;
export type StockOutInput = z.infer<typeof stockOutSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
