import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redis: Redis | null = null;

// In-memory fallback cache when Redis is unavailable
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 5) {
        logger.error('Redis: max retry attempts reached, giving up');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  client.on('connect', () => logger.info('Redis: connected'));
  client.on('error', (err: any) => logger.warn('Redis: connection error', { error: err.message }));
  client.on('close', () => logger.warn('Redis: connection closed'));

  return client;
}

export async function connectRedis(): Promise<void> {
  try {
    redis = createRedisClient();
    await redis.connect();
  } catch (error) {
    logger.warn('Redis: failed to connect, using in-memory fallback', {
      error: error instanceof Error ? error.message : String(error),
    });
    redis = null;
  }
}

export function getRedis(): Redis | null {
  return redis;
}

// Cache helper with graceful fallback
export const cache = {
  async get(key: string): Promise<string | null> {
    try {
      if (redis) {
        return await redis.get(key);
      }
    } catch {
      logger.warn('Redis get failed, checking memory cache', { key });
    }
    // Memory fallback
    const entry = memoryCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }
    memoryCache.delete(key);
    return null;
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (redis) {
        if (ttlSeconds) {
          await redis.setex(key, ttlSeconds, value);
        } else {
          await redis.set(key, value);
        }
        return;
      }
    } catch {
      logger.warn('Redis set failed, using memory cache', { key });
    }
    // Memory fallback
    memoryCache.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : Date.now() + 3600000,
    });
  },

  async del(key: string): Promise<void> {
    try {
      if (redis) {
        await redis.del(key);
      }
    } catch {
      logger.warn('Redis del failed', { key });
    }
    memoryCache.delete(key);
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (redis) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch {
      logger.warn('Redis pattern invalidation failed', { pattern });
    }
    // Clear matching keys from memory cache
    for (const key of memoryCache.keys()) {
      if (key.startsWith(pattern.replace('*', ''))) {
        memoryCache.delete(key);
      }
    }
  },
};
