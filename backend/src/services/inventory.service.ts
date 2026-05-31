import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { cache } from '../config/redis.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import type { StockInInput, StockOutInput, TransferInput } from '../validators/inventory.validator.js';

export const inventoryService = {
  async getStockOverview(params: {
    page?: number;
    limit?: number;
    warehouseId?: string;
    search?: string;
    lowStockOnly?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryWhereInput = {};
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.search) {
      where.product = {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { sku: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, sku: true, price: true, reorderLevel: true, isActive: true },
          },
          warehouse: {
            select: { id: true, warehouseName: true, location: true },
          },
        },
        orderBy: { product: { name: 'asc' } },
        skip,
        take: limit,
      }),
      prisma.inventory.count({ where }),
    ]);

    const result = params.lowStockOnly === 'true'
      ? data.filter((inv) => inv.quantity <= inv.product.reorderLevel)
      : data;

    return {
      data: result,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getMovements(params: {
    page?: number;
    limit?: number;
    productId?: string;
    warehouseId?: string;
    movementType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryMovementWhereInput = {};
    if (params.productId) where.productId = params.productId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.movementType) where.movementType = params.movementType;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    const [data, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, warehouseName: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async stockIn(input: StockInInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      // Upsert inventory record
      const inventory = await tx.inventory.upsert({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
        update: { quantity: { increment: input.quantity } },
        create: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          quantity: input.quantity,
        },
      });

      // Update aggregate product quantity
      await tx.product.update({
        where: { id: input.productId },
        data: { quantity: { increment: input.quantity } },
      });

      // Create movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          movementType: 'STOCK_IN',
          quantity: input.quantity,
          reference: input.reference || null,
          notes: input.notes || null,
          performedBy: userId,
        },
      });

      await cache.invalidatePattern('inventory:*');
      await cache.invalidatePattern('kpi:*');
      return { inventory, movement };
    });
  },

  async stockOut(input: StockOutInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      // Check current stock
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
      });

      if (!inventory || inventory.quantity < input.quantity) {
        throw new AppError(
          `Insufficient stock. Available: ${inventory?.quantity ?? 0}, Requested: ${input.quantity}`,
          400
        );
      }

      // Decrement
      const updated = await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
        data: { quantity: { decrement: input.quantity } },
      });

      await tx.product.update({
        where: { id: input.productId },
        data: { quantity: { decrement: input.quantity } },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          movementType: 'STOCK_OUT',
          quantity: -input.quantity,
          reference: input.reference || null,
          notes: input.notes || null,
          performedBy: userId,
        },
      });

      await cache.invalidatePattern('inventory:*');
      await cache.invalidatePattern('kpi:*');
      return { inventory: updated, movement };
    });
  },

  async transfer(input: TransferInput, userId: string) {
    if (input.fromWarehouseId === input.toWarehouseId) {
      throw new AppError('Source and destination warehouses must be different.', 400);
    }

    return prisma.$transaction(async (tx) => {
      // Verify source stock
      const source = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.fromWarehouseId,
          },
        },
      });

      if (!source || source.quantity < input.quantity) {
        throw new AppError(
          `Insufficient stock for transfer. Available: ${source?.quantity ?? 0}, Requested: ${input.quantity}`,
          400
        );
      }

      // Decrement source
      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.fromWarehouseId,
          },
        },
        data: { quantity: { decrement: input.quantity } },
      });

      // Increment destination (upsert)
      await tx.inventory.upsert({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.toWarehouseId,
          },
        },
        update: { quantity: { increment: input.quantity } },
        create: {
          productId: input.productId,
          warehouseId: input.toWarehouseId,
          quantity: input.quantity,
        },
      });

      // Log both movements
      await tx.inventoryMovement.createMany({
        data: [
          {
            productId: input.productId,
            warehouseId: input.fromWarehouseId,
            movementType: 'TRANSFER_OUT',
            quantity: -input.quantity,
            reference: `Transfer to ${input.toWarehouseId}`,
            notes: input.notes || null,
            performedBy: userId,
          },
          {
            productId: input.productId,
            warehouseId: input.toWarehouseId,
            movementType: 'TRANSFER_IN',
            quantity: input.quantity,
            reference: `Transfer from ${input.fromWarehouseId}`,
            notes: input.notes || null,
            performedBy: userId,
          },
        ],
      });

      await cache.invalidatePattern('inventory:*');
      await cache.invalidatePattern('kpi:*');
      return { message: 'Stock transferred successfully.' };
    });
  },

  // ─── WAREHOUSES ────────────────────────────────────

  async listWarehouses() {
    return prisma.warehouse.findMany({
      where: { isActive: true },
      include: { _count: { select: { inventoryRecords: true } } },
      orderBy: { warehouseName: 'asc' },
    });
  },

  async getWarehouseById(id: string) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventoryRecords: {
          include: {
            product: { select: { id: true, name: true, sku: true, price: true, reorderLevel: true } },
          },
        },
      },
    });
    if (!warehouse) throw new AppError('Warehouse not found.', 404);
    return warehouse;
  },

  async createWarehouse(input: { warehouseName: string; location: string }) {
    return prisma.warehouse.create({ data: input });
  },

  async updateWarehouse(id: string, input: { warehouseName?: string; location?: string }) {
    const existing = await prisma.warehouse.findUnique({ where: { id } });
    if (!existing) throw new AppError('Warehouse not found.', 404);
    return prisma.warehouse.update({ where: { id }, data: input });
  },

  async deleteWarehouse(id: string) {
    const inventoryCount = await prisma.inventory.count({
      where: { warehouseId: id, quantity: { gt: 0 } },
    });
    if (inventoryCount > 0) {
      throw new AppError('Cannot deactivate warehouse with active stock. Transfer stock first.', 400);
    }
    await prisma.warehouse.update({ where: { id }, data: { isActive: false } });
  },
};
