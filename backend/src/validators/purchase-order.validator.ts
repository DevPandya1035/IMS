import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Invalid supplier ID'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive('Quantity must be a positive integer'),
        unitPrice: z.number().positive('Unit price must be positive'),
      })
    )
    .min(1, 'At least one item is required'),
  discount: z.number().min(0).optional().default(0),
  adjustment: z.number().optional().default(0),
  notes: z.string().max(500).optional().nullable(),
});

export const updatePurchaseOrderSchema = z.object({
  supplierId: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      })
    )
    .min(1)
    .optional(),
  discount: z.number().min(0).optional(),
  adjustment: z.number().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const receivePOSchema = z.object({
  warehouseId: z.string().min(1, 'Valid warehouse ID is required'),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type ReceivePOInput = z.infer<typeof receivePOSchema>;
