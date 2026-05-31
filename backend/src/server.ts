import cron from 'node-cron';
import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { connectRedis, getRedis } from './config/redis.js';
import { logger } from './config/logger.js';
import { runExpiryCheck } from './jobs/expiry-check.job.js';
import { runForecastRefresh } from './jobs/forecast-refresh.job.js';

let server: any;

async function bootstrap() {
  try {
    // 1. Test database connection
    logger.info('Connecting to PostgreSQL database...');
    await prisma.$connect();
    logger.info('Database connection established successfully.');

    // 2. Connect to Redis cache
    logger.info('Connecting to Redis...');
    await connectRedis();

    // 3. Register cron jobs
    logger.info('Registering scheduled cron jobs...');
    // Expiry check daily at 6 AM IST
    cron.schedule('0 6 * * *', async () => {
      logger.info('Running scheduled task: Expiry Check');
      await runExpiryCheck();
    }, { timezone: 'Asia/Kolkata' });

    // Forecast refresh daily at 2 AM IST
    cron.schedule('0 2 * * *', async () => {
      logger.info('Running scheduled task: Forecast Cache Refresh');
      await runForecastRefresh();
    }, { timezone: 'Asia/Kolkata' });

    // 4. Start HTTP Server
    server = app.listen(env.PORT, () => {
      logger.info(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
    });

  } catch (error) {
    logger.error('Bootstrapping server failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown helper
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        // Disconnect DB
        await prisma.$disconnect();
        logger.info('Database disconnected.');

        // Disconnect Redis
        const redis = getRedis();
        if (redis) {
          await redis.quit();
          logger.info('Redis client disconnected.');
        }

        logger.info('Shutdown complete. Exiting.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during graceful shutdown:', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

bootstrap();
