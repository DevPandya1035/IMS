import { z } from 'zod';

export const createSalesOrderSchema = z.object({
  customerId: z.string().optional().nullable(),
  customerName: z.string().min(1, 'Customer name is required').max(200),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().max(20).optional().nullable(),
  warehouseId: z.string().min(1, 'Valid warehouse ID is required'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        productName: z.string().min(1),
        quantity: z.number().int().positive('Quantity must be positive'),
        unitPrice: z.number().positive('Unit price must be positive'),
        discount: z.number().min(0).default(0),
      })
    )
    .min(1, 'At least one item is required'),
  discount: z.number().min(0).optional().default(0),
  adjustment: z.number().optional().default(0),
  notes: z.string().max(500).optional().nullable(),
});

export const updateSalesOrderSchema = z.object({
  customerName: z.string().min(1).max(200).optional(),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().max(20).optional().nullable(),
  warehouseId: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        productName: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
        discount: z.number().min(0).default(0),
      })
    )
    .min(1)
    .optional(),
  discount: z.number().min(0).optional(),
  adjustment: z.number().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const paymentSchema = z.object({
  salesOrderId: z.string().optional().nullable(),
  purchaseOrderId: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['UPI', 'CARD', 'CASH', 'NEFT', 'RTGS', 'CHEQUE']),
  reference: z.string().max(100).optional().nullable(),
}).refine((data) => data.salesOrderId || data.purchaseOrderId || data.invoiceId, {
  message: 'Either salesOrderId, purchaseOrderId, or invoiceId is required.',
  path: ['invoiceId'],
});

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  gstin: z.string().max(15).optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
