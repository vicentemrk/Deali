import { Redis } from '@upstash/redis';

// Create the redis client if env vars are present
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Obtiene valor del cache o ejecuta fn() y lo guarda con ttlSeconds
 */
export async function cached<T>(key: string, fn: () => Promise<T>, ttlSeconds: number): Promise<T> {
  if (!redis) {
    return fn();
  }

  try {
    const cachedValue = await redis.get<T>(key);
    if (cachedValue !== null) {
      return cachedValue;
    }
  } catch (error) {
    console.error(`[Redis Error GET] ${error}`);
  }

  const result = await fn();

  try {
    await redis.setex(key, ttlSeconds, result);
  } catch (error) {
    console.error(`[Redis Error SET] ${error}`);
  }

  return result;
}

/**
 * Invalida todas las keys que empiecen con prefix
 */
export async function invalidatePrefix(prefix: string): Promise<void> {
  if (!redis) return;
  try {
    let cursor = 0;
    do {
      const result = await redis.scan(cursor, { match: `${prefix}*`, count: 100 });
      cursor = Number(result[0]);
      const keys = result[1];
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== 0);
  } catch (error) {
    console.error(`[Redis Error SCAN/DEL] ${error}`);
  }
}
