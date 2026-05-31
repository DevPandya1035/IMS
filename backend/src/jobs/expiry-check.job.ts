import { prisma } from '../config/database.js';
import { notificationService } from '../services/notifications.service.js';
import { logger } from '../config/logger.js';

export async function runExpiryCheck() {
  logger.info('Starting daily product expiry check job...');
  try {
    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);

    // 1. Handle EXPIRED products (expiryDate < now and isActive = true)
    const expiredProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        expiryDate: {
          lt: now,
        },
      },
    });

    for (const product of expiredProducts) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isActive: false },
      });

      await notificationService.create({
        title: 'Product Expired',
        message: `Product ${product.name} (${product.sku}) has expired (Expiry: ${product.expiryDate?.toLocaleDateString()}) and has been deactivated.`,
        type: 'EXPIRED',
        entity: 'Product',
        entityId: product.id,
      });

      logger.warn(`Product ${product.name} (${product.sku}) has expired and was deactivated.`);
    }

    // 2. Handle NEAR_EXPIRY products (expiryDate between now and 90 days, and isActive = true)
    const nearExpiryProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        expiryDate: {
          gte: now,
          lte: ninetyDaysFromNow,
        },
      },
    });

    for (const product of nearExpiryProducts) {
      // Check if a near-expiry notification was already created in the last 7 days to avoid spamming
      const existingNotification = await prisma.notification.findFirst({
        where: {
          entityId: product.id,
          type: 'NEAR_EXPIRY',
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!existingNotification) {
        await notificationService.create({
          title: 'Product Near Expiry',
          message: `Product ${product.name} (${product.sku}) will expire on ${product.expiryDate?.toLocaleDateString()} (within 90 days).`,
          type: 'NEAR_EXPIRY',
          entity: 'Product',
          entityId: product.id,
        });

        logger.info(`Product ${product.name} (${product.sku}) flagged as near expiry.`);
      }
    }

    logger.info('Product expiry check job finished successfully.');
  } catch (error: any) {
    logger.error('Error running expiry check job:', error);
  }
}
