import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { cache } from '../config/redis.js';
import { AppError } from '../middlewares/errorHandler.middleware.js';
import type { CreateProductInput, UpdateProductInput, CreateCategoryInput, CreateSupplierInput } from '../validators/product.validator.js';

export const productService = {
  // ─── PRODUCTS ───────────────────────────────────────

  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    supplierId?: string;
    isActive?: string;
    isLowStock?: string;
    sort?: string;
    order?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.supplierId) where.supplierId = params.supplierId;
    if (params.isActive !== undefined) where.isActive = params.isActive === 'true';
    if (params.isLowStock === 'true') {
      where.quantity = { lte: prisma.product.fields.reorderLevel as unknown as number };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    const sortField = params.sort || 'createdAt';
    const sortOrder = params.order === 'asc' ? 'asc' : 'desc';
    (orderBy as Record<string, string>)[sortField] = sortOrder;

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, categoryName: true } },
          supplier: { select: { id: true, supplierName: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        inventoryRecords: {
          include: { warehouse: { select: { id: true, warehouseName: true, location: true } } },
        },
      },
    });

    if (!product) throw new AppError('Product not found.', 404);
    return product;
  },

  async create(input: CreateProductInput) {
    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({ where: { sku: input.sku } });
    if (existingSku) throw new AppError('A product with this SKU already exists.', 409);

    if (input.barcode) {
      const existingBarcode = await prisma.product.findUnique({ where: { barcode: input.barcode } });
      if (existingBarcode) throw new AppError('A product with this barcode already exists.', 409);
    }

    const product = await prisma.product.create({
      data: {
        name: input.name,
        sku: input.sku,
        barcode: input.barcode || null,
        description: input.description || null,
        price: input.price,
        costPrice: input.costPrice || null,
        reorderLevel: input.reorderLevel,
        categoryId: input.categoryId,
        supplierId: input.supplierId || null,
        imageUrl: input.imageUrl || null,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      },
      include: {
        category: { select: { id: true, categoryName: true } },
        supplier: { select: { id: true, supplierName: true } },
      },
    });

    await cache.invalidatePattern('products:*');
    return product;
  },

  async update(id: string, input: UpdateProductInput) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new AppError('Product not found.', 404);

    if (input.sku && input.sku !== existing.sku) {
      const dup = await prisma.product.findUnique({ where: { sku: input.sku } });
      if (dup) throw new AppError('A product with this SKU already exists.', 409);
    }

    if (input.barcode && input.barcode !== existing.barcode) {
      const dup = await prisma.product.findUnique({ where: { barcode: input.barcode } });
      if (dup) throw new AppError('A product with this barcode already exists.', 409);
    }

    const data: Record<string, unknown> = { ...input };
    if (input.expiryDate) data.expiryDate = new Date(input.expiryDate);

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, categoryName: true } },
        supplier: { select: { id: true, supplierName: true } },
      },
    });

    await cache.invalidatePattern('products:*');
    return product;
  },

  async delete(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new AppError('Product not found.', 404);

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await cache.invalidatePattern('products:*');
  },

  // ─── CATEGORIES ────────────────────────────────────

  async listCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { categoryName: 'asc' },
    });
  },

  async createCategory(input: CreateCategoryInput) {
    const category = await prisma.category.create({ data: input });
    await cache.invalidatePattern('categories:*');
    return category;
  },

  async updateCategory(id: string, input: Partial<CreateCategoryInput>) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new AppError('Category not found.', 404);

    const category = await prisma.category.update({ where: { id }, data: input });
    await cache.invalidatePattern('categories:*');
    return category;
  },

  async deleteCategory(id: string) {
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new AppError('Cannot delete category with linked products.', 400);
    }

    await prisma.category.update({ where: { id }, data: { isActive: false } });
    await cache.invalidatePattern('categories:*');
  },

  // ─── SUPPLIERS ─────────────────────────────────────

  async listSuppliers() {
    return prisma.supplier.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true, purchaseOrders: true } } },
      orderBy: { supplierName: 'asc' },
    });
  },

  async getSupplierById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { products: { where: { isActive: true }, select: { id: true, name: true, sku: true } } },
    });
    if (!supplier) throw new AppError('Supplier not found.', 404);
    return supplier;
  },

  async createSupplier(input: CreateSupplierInput) {
    return prisma.supplier.create({ data: input });
  },

  async updateSupplier(id: string, input: Partial<CreateSupplierInput>) {
    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new AppError('Supplier not found.', 404);
    return prisma.supplier.update({ where: { id }, data: input });
  },

  async deleteSupplier(id: string) {
    const poCount = await prisma.purchaseOrder.count({ where: { supplierId: id } });
    if (poCount > 0) {
      throw new AppError('Cannot delete supplier with linked purchase orders.', 400);
    }
    await prisma.supplier.update({ where: { id }, data: { isActive: false } });
  },
};
