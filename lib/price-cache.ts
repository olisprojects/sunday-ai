const TTL_SECONDS = 48 * 60 * 60; // 48 hours

// Falls back to in-memory when Upstash env vars aren't set (local dev)
const inMemory = new Map<string, { value: unknown; expiresAt: number }>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return await redis.get<T>(key);
  }
  const entry = inMemory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { inMemory.delete(key); return null; }
  return entry.value as T;
}

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    await redis.set(key, value, { ex: TTL_SECONDS });
    return;
  }
  inMemory.set(key, { value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
}
