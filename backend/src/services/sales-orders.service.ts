import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { cache } from '../config/redis.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import { invoiceService } from './invoices.service.js';
import type { CreateSalesOrderInput } from '../validators/sales-order.validator.js';

function generateSONumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `SO-${dateStr}-${seq}`;
}

export const salesOrderService = {
  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    isPaid?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.SalesOrderWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.customerId) where.customerId = params.customerId;
    if (params.isPaid !== undefined) where.isPaid = params.isPaid === 'true';

    const [data, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          warehouse: { select: { id: true, warehouseName: true } },
          creator: { select: { id: true, name: true } },
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
      prisma.salesOrder.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const so = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        warehouse: true,
        creator: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, price: true } },
          },
        },
        invoice: true,
        payments: true,
      },
    });
    if (!so) throw new AppError('Sales order not found.', 404);
    return so;
  },

  async create(input: CreateSalesOrderInput, userId: string) {
    const itemsTotal = input.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice - item.discount),
      0
    );
    const discount = input.discount || 0;
    const adjustment = input.adjustment || 0;
    const totalAmount = Math.max(0, itemsTotal - discount + adjustment);

    const orderNumber = generateSONumber();

    const so = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId: input.customerId || null,
        customerName: input.customerName,
        customerEmail: input.customerEmail || null,
        customerPhone: input.customerPhone || null,
        warehouseId: input.warehouseId,
        totalAmount,
        discount,
        adjustment,
        createdBy: userId,
        notes: input.notes || null,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
          })),
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        warehouse: { select: { id: true, warehouseName: true } },
        items: true,
      },
    });

    await cache.invalidatePattern('kpi:*');
    return so;
  },

  async update(id: string, input: Partial<CreateSalesOrderInput>) {
    const existing = await prisma.salesOrder.findUnique({ where: { id } });
    if (!existing) throw new AppError('Sales order not found.', 404);
    if (existing.status !== 'PENDING') {
      throw new AppError('Only PENDING sales orders can be updated.', 422);
    }

    const updateData: Record<string, unknown> = {};
    if (input.customerName) updateData.customerName = input.customerName;
    if (input.customerEmail !== undefined) updateData.customerEmail = input.customerEmail;
    if (input.customerPhone !== undefined) updateData.customerPhone = input.customerPhone;
    if (input.warehouseId) updateData.warehouseId = input.warehouseId;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const orderDiscount = input.discount !== undefined ? input.discount : Number(existing.discount);
    const orderAdjustment = input.adjustment !== undefined ? input.adjustment : Number(existing.adjustment);
    updateData.discount = orderDiscount;
    updateData.adjustment = orderAdjustment;

    if (input.items) {
      const itemsTotal = input.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice - item.discount),
        0
      );
      updateData.totalAmount = Math.max(0, itemsTotal - orderDiscount + orderAdjustment);

      await prisma.salesOrderItem.deleteMany({ where: { salesOrderId: id } });
      await prisma.salesOrderItem.createMany({
        data: input.items.map((item) => ({
          salesOrderId: id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
      });
    } else if (input.discount !== undefined || input.adjustment !== undefined) {
      const items = await prisma.salesOrderItem.findMany({ where: { salesOrderId: id } });
      const itemsTotal = items.reduce(
        (sum, item) => sum + (item.quantity * Number(item.unitPrice) - Number(item.discount)),
        0
      );
      updateData.totalAmount = Math.max(0, itemsTotal - orderDiscount + orderAdjustment);
    }

    return prisma.salesOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        customer: { select: { id: true, name: true } },
      },
    });
  },

  async delete(id: string) {
    const existing = await prisma.salesOrder.findUnique({ where: { id } });
    if (!existing) throw new AppError('Sales order not found.', 404);
    if (!['PENDING', 'CANCELLED'].includes(existing.status)) {
      throw new AppError('Only PENDING or CANCELLED unpaid orders can be deleted.', 422);
    }
    if (existing.isPaid) {
      throw new AppError('Cannot delete a paid sales order.', 422);
    }
    await prisma.salesOrder.delete({ where: { id } });
    await cache.invalidatePattern('kpi:*');
  },

  async confirm(id: string, userId: string) {
    const so = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!so) throw new AppError('Sales order not found.', 404);
    if (so.status !== 'PENDING') {
      throw new AppError('Only PENDING sales orders can be confirmed.', 422);
    }
    if (!so.warehouseId) {
      throw new AppError('Warehouse must be set before confirming.', 400);
    }

    return prisma.$transaction(async (tx) => {
      // Check and deduct stock for each item
      for (const item of so.items) {
        const inventory = await tx.inventory.findUnique({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: so.warehouseId!,
            },
          },
        });

        if (!inventory || inventory.quantity < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${item.productName}". Available: ${inventory?.quantity ?? 0}, Required: ${item.quantity}`,
            400
          );
        }

        // Deduct from warehouse inventory
        await tx.inventory.update({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: so.warehouseId!,
            },
          },
          data: { quantity: { decrement: item.quantity } },
        });

        // Deduct from aggregate product quantity
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Update SO status
      const updated = await tx.salesOrder.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: { items: true, customer: true },
      });

      // Auto-generate invoice
      await invoiceService.generateFromSalesOrder(id, tx);

      await cache.invalidatePattern('inventory:*');
      await cache.invalidatePattern('kpi:*');
      return updated;
    });
  },

  async ship(id: string, userId: string) {
    const so = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!so) throw new AppError('Sales order not found.', 404);
    if (so.status !== 'CONFIRMED') {
      throw new AppError('Only CONFIRMED sales orders can be shipped.', 422);
    }

    return prisma.$transaction(async (tx) => {
      // Create STOCK_OUT movements
      for (const item of so.items) {
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            warehouseId: so.warehouseId!,
            movementType: 'STOCK_OUT',
            quantity: -item.quantity,
            reference: so.orderNumber,
            notes: `Shipped for SO ${so.orderNumber}`,
            performedBy: userId,
          },
        });
      }

      return tx.salesOrder.update({
        where: { id },
        data: { status: 'SHIPPED' },
      });
    });
  },

  async deliver(id: string) {
    const so = await prisma.salesOrder.findUnique({ where: { id } });
    if (!so) throw new AppError('Sales order not found.', 404);
    if (so.status !== 'SHIPPED') {
      throw new AppError('Only SHIPPED sales orders can be delivered.', 422);
    }
    return prisma.salesOrder.update({
      where: { id },
      data: { status: 'DELIVERED' },
    });
  },

  async cancel(id: string, userId: string) {
    const so = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!so) throw new AppError('Sales order not found.', 404);
    if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(so.status)) {
      throw new AppError(`Cannot cancel a ${so.status} sales order.`, 422);
    }

    return prisma.$transaction(async (tx) => {
      // If CONFIRMED, restore stock
      if (so.status === 'CONFIRMED' && so.warehouseId) {
        for (const item of so.items) {
          await tx.inventory.update({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: so.warehouseId!,
              },
            },
            data: { quantity: { increment: item.quantity } },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { increment: item.quantity } },
          });

          // Create RETURN movement
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              warehouseId: so.warehouseId!,
              movementType: 'RETURN',
              quantity: item.quantity,
              reference: so.orderNumber,
              notes: `Stock restored from cancelled SO ${so.orderNumber}`,
              performedBy: userId,
            },
          });
        }

        // Cancel linked invoice
        await tx.invoice.updateMany({
          where: { salesOrderId: id },
          data: { status: 'CANCELLED' },
        });
      }

      const updated = await tx.salesOrder.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      await cache.invalidatePattern('inventory:*');
      await cache.invalidatePattern('kpi:*');
      return updated;
    });
  },
};
