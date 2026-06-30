// Cache expires at the next Wednesday midnight AEST — when AU stores reprice
function ttlUntilNextWednesday(): number {
  // Shift to AEST (UTC+10)
  const aestNow = new Date(Date.now() + 10 * 3600 * 1000);
  const day = aestNow.getUTCDay(); // 0=Sun … 3=Wed … 6=Sat
  const daysUntil = (3 - day + 7) % 7 || 7; // if today is Wed, next Wed = 7 days
  const nextWed = new Date(aestNow);
  nextWed.setUTCDate(aestNow.getUTCDate() + daysUntil);
  nextWed.setUTCHours(0, 0, 0, 0);
  return Math.round((nextWed.getTime() - aestNow.getTime()) / 1000);
}

// Falls back to in-memory when Upstash env vars aren't set (local dev)
const inMemory = new Map<string, { value: unknown; expiresAt: number }>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (redisUrl && redisToken) {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: redisUrl, token: redisToken });
    return await redis.get<T>(key);
  }
  const entry = inMemory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { inMemory.delete(key); return null; }
  return entry.value as T;
}

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  const ttl = ttlUntilNextWednesday();
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (redisUrl && redisToken) {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: redisUrl, token: redisToken });
    await redis.set(key, value, { ex: ttl });
    return;
  }
  inMemory.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
}
