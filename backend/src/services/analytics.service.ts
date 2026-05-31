import { prisma } from '../config/database.js';
import { cache } from '../config/redis.js';

export const analyticsService = {
  async getDashboardKPIs() {
    const cacheKey = 'kpi:dashboard';
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalWarehouses,
      totalOrders,
      pendingOrders,
      totalRevenue,
      pendingPOs,
      recentMovements,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({
        where: {
          isActive: true,
          quantity: { lte: 10 },
        },
      }),
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.salesOrder.count(),
      prisma.salesOrder.count({ where: { status: 'PENDING' } }),
      prisma.salesOrder.aggregate({
        where: { status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] } },
        _sum: { totalAmount: true },
      }),
      prisma.purchaseOrder.count({ where: { status: 'PENDING' } }),
      prisma.inventoryMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { warehouseName: true } },
          user: { select: { name: true } },
        },
      }),
    ]);

    const kpis = {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalWarehouses,
      totalOrders,
      pendingOrders,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      pendingPOs,
      recentMovements,
    };

    await cache.set(cacheKey, JSON.stringify(kpis), 300); // 5 min TTL
    return kpis;
  },

  async getSalesTrends(startDate?: string, endDate?: string) {
    const where: Record<string, unknown> = {
      status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      select: {
        totalAmount: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate by day
    const dailyTrends = new Map<string, { revenue: number; count: number }>();
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().slice(0, 10);
      const existing = dailyTrends.get(dateKey) || { revenue: 0, count: 0 };
      existing.revenue += Number(order.totalAmount);
      existing.count += 1;
      dailyTrends.set(dateKey, existing);
    }

    return Array.from(dailyTrends.entries())
      .map(([date, data]) => ({
        date,
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async getInventoryValuation() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        price: true,
        costPrice: true,
        category: { select: { categoryName: true } },
      },
    });

    let totalRetailValue = 0;
    let totalCostValue = 0;

    const items = products.map((p) => {
      const retailValue = Number(p.price) * p.quantity;
      const costValue = Number(p.costPrice || p.price) * p.quantity;
      totalRetailValue += retailValue;
      totalCostValue += costValue;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.categoryName,
        quantity: p.quantity,
        unitPrice: Number(p.price),
        costPrice: Number(p.costPrice || p.price),
        retailValue: Math.round(retailValue * 100) / 100,
        costValue: Math.round(costValue * 100) / 100,
        margin: Math.round(((retailValue - costValue) / (retailValue || 1)) * 10000) / 100,
      };
    });

    return {
      totalRetailValue: Math.round(totalRetailValue * 100) / 100,
      totalCostValue: Math.round(totalCostValue * 100) / 100,
      potentialProfit: Math.round((totalRetailValue - totalCostValue) * 100) / 100,
      items: items.sort((a, b) => b.retailValue - a.retailValue),
    };
  },
};
