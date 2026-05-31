import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { cache } from '../config/redis.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import type { CreatePurchaseOrderInput, ReceivePOInput } from '../validators/purchase-order.validator.js';
import { invoiceService } from './invoices.service.js';

function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `PO-${dateStr}-${seq}`;
}

export const purchaseOrderService = {
  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    supplierId?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.supplierId) where.supplierId = params.supplierId;

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, supplierName: true } },
          creator: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
          invoice: { select: { id: true, invoiceNumber: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        creator: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, price: true } },
          },
        },
        invoice: true,
        payments: true,
      },
    });
    if (!po) throw new AppError('Purchase order not found.', 404);
    return po;
  },

  async create(input: CreatePurchaseOrderInput, userId: string) {
    const itemsTotal = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const discount = input.discount || 0;
    const adjustment = input.adjustment || 0;
    const totalAmount = Math.max(0, itemsTotal - discount + adjustment);

    const orderNumber = generateOrderNumber();

    const po = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: input.supplierId,
        totalAmount,
        discount,
        adjustment,
        status: totalAmount <= 50000 ? 'APPROVED' : 'PENDING',
        createdBy: userId,
        approvedBy: totalAmount <= 50000 ? userId : null,
        approvedAt: totalAmount <= 50000 ? new Date() : null,
        notes: input.notes || null,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        supplier: { select: { id: true, supplierName: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (po.status === 'APPROVED') {
      await invoiceService.generateFromPurchaseOrder(po.id);
    }

    await cache.invalidatePattern('kpi:*');
    return po;
  },

  async update(id: string, input: Partial<CreatePurchaseOrderInput>) {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) throw new AppError('Purchase order not found.', 404);
    if (existing.status !== 'PENDING') {
      throw new AppError('Only PENDING purchase orders can be updated.', 422);
    }

    const updateData: any = {};
    if (input.supplierId) updateData.supplier = { connect: { id: input.supplierId } };
    if (input.notes !== undefined) updateData.notes = input.notes || null;

    const orderDiscount = input.discount !== undefined ? input.discount : Number(existing.discount);
    const orderAdjustment = input.adjustment !== undefined ? input.adjustment : Number(existing.adjustment);
    updateData.discount = orderDiscount;
    updateData.adjustment = orderAdjustment;

    if (input.items) {
      const itemsTotal = input.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      updateData.totalAmount = Math.max(0, itemsTotal - orderDiscount + orderAdjustment);

      // Delete existing items and recreate
      await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      await prisma.purchaseOrderItem.createMany({
        data: input.items.map((item) => ({
          purchaseOrderId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
    } else if (input.discount !== undefined || input.adjustment !== undefined) {
      const items = await prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
      const itemsTotal = items.reduce(
        (sum, item) => sum + item.quantity * Number(item.unitPrice),
        0
      );
      updateData.totalAmount = Math.max(0, itemsTotal - orderDiscount + orderAdjustment);
    }

    return prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: { select: { id: true, supplierName: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });
  },

  async delete(id: string) {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) throw new AppError('Purchase order not found.', 404);
    if (!['PENDING', 'CANCELLED'].includes(existing.status)) {
      throw new AppError('Only PENDING or CANCELLED purchase orders can be deleted.', 422);
    }
    await prisma.purchaseOrder.delete({ where: { id } });
    await cache.invalidatePattern('kpi:*');
  },

  async approve(id: string, userId: string) {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new AppError('Purchase order not found.', 404);
    if (po.status !== 'PENDING') {
      throw new AppError('Only PENDING purchase orders can be approved.', 422);
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        supplier: { select: { id: true, supplierName: true } },
        items: true,
      },
    });

    await invoiceService.generateFromPurchaseOrder(id);

    return updated;
  },

  async receive(id: string, input: ReceivePOInput, userId: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) throw new AppError('Purchase order not found.', 404);
    if (po.status !== 'APPROVED') {
      throw new AppError('Only APPROVED purchase orders can be received.', 422);
    }

    return prisma.$transaction(async (tx) => {
      // Update PO status
      await tx.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED' },
      });

      // For each item: stock-in + movement
      for (const item of po.items) {
        await tx.inventory.upsert({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: input.warehouseId,
            },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            productId: item.productId,
            warehouseId: input.warehouseId,
            quantity: item.quantity,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            warehouseId: input.warehouseId,
            movementType: 'STOCK_IN',
            quantity: item.quantity,
            reference: po.orderNumber,
            notes: `Received from PO ${po.orderNumber}`,
            performedBy: userId,
          },
        });
      }

      await cache.invalidatePattern('inventory:*');
      await cache.invalidatePattern('kpi:*');
      return { message: 'Purchase order received. Stock incremented.' };
    });
  },

  async cancel(id: string) {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new AppError('Purchase order not found.', 404);
    if (po.status === 'RECEIVED') {
      throw new AppError('Cannot cancel a RECEIVED purchase order.', 422);
    }
    if (po.status === 'CANCELLED') {
      throw new AppError('Purchase order is already cancelled.', 422);
    }

    return prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  },
};
