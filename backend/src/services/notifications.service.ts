import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';

export const notificationService = {
  async create(data: {
    userId?: string;
    title: string;
    message: string;
    type: string;
    entity?: string;
    entityId?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId || null,
        title: data.title,
        message: data.message,
        type: data.type,
        entity: data.entity || null,
        entityId: data.entityId || null,
      },
    });
  },

  async getForUser(userId: string, unreadOnly: boolean = false) {
    return prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { userId: null }, // Broadcasts
        ],
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  async markRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        OR: [{ userId }, { userId: null }],
        isRead: false,
      },
      data: { isRead: true },
    });
  },

  async checkLowStock() {
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        quantity: { lte: prisma.product.fields.reorderLevel as unknown as number },
      },
      select: { id: true, name: true, sku: true, quantity: true, reorderLevel: true },
    });

    for (const product of lowStockProducts) {
      await this.create({
        title: 'Low Stock Alert',
        message: `${product.name} (${product.sku}) is low on stock. Current: ${product.quantity}, Reorder Level: ${product.reorderLevel}`,
        type: 'LOW_STOCK',
        entity: 'Product',
        entityId: product.id,
      });
    }

    logger.info(`Low stock check complete. ${lowStockProducts.length} alerts generated.`);
  },
};
