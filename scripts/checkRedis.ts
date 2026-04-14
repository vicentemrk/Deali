import { Redis } from '@upstash/redis';

const url   = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error('❌ Faltan UPSTASH_REDIS_REST_URL o UPSTASH_REDIS_REST_TOKEN en .env.local');
  process.exit(1);
}

const redis = new Redis({ url, token });

async function test() {
  try {
    // 1. Ping
    const pong = await redis.ping();
    console.log('✅ PING:', pong);

    // 2. Write + Read
    await redis.setex('deali:test', 30, { hello: 'world', ts: Date.now() });
    const val = await redis.get('deali:test');
    console.log('✅ SET/GET:', JSON.stringify(val));

    // 3. Delete
    await redis.del('deali:test');
    console.log('✅ DEL: ok');

    console.log('\n✅ Redis conectado correctamente. El cache está activo.');
  } catch (err: any) {
    console.error('❌ Redis error:', err.message);
    process.exit(1);
  }
}

test();
