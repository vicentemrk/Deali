import * as dotenv from 'dotenv';
import * as path from 'path';
import { Redis } from '@upstash/redis';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

async function invalidateCache() {
  if (!redis) {
    console.log('Redis not configured, skipping cache invalidation');
    return;
  }
  
  console.log('Invalidating offers cache...');
  try {
    let cursor = 0;
    do {
      const result = await redis.scan(cursor, { match: 'offers:list:*', count: 100 });
      cursor = Number(result[0]);
      const keys = result[1];
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`✓ Deleted ${keys.length} cache keys`);
      }
    } while (cursor !== 0);
  } catch (error) {
    console.error('Error:', error);
  }
}

invalidateCache();
