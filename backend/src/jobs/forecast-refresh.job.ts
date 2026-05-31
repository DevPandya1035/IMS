import { prisma } from '../config/database.js';
import { forecastingService } from '../services/forecasting.service.js';
import { logger } from '../config/logger.js';
import { cache } from '../config/redis.js';

export async function runForecastRefresh() {
  logger.info('Starting daily forecast cache refresh job...');
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sku: true },
    });

    logger.info(`Refreshing forecasts for ${products.length} active products.`);

    for (const product of products) {
      try {
        // Evict existing cache first to force recalculation
        const cacheKey = `forecast:${product.id}`;
        await cache.del(cacheKey);

        // Recalculate and cache
        await forecastingService.getDemandForecast(product.id);
      } catch (err: any) {
        logger.error(`Error refreshing forecast for product ${product.name} (${product.sku}):`, err);
      }
    }

    logger.info('Forecast cache refresh job finished successfully.');
  } catch (error: any) {
    logger.error('Error running forecast cache refresh job:', error);
  }
}
