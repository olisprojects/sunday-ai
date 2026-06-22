const TTL_SECONDS = 48 * 60 * 60; // 48 hours

// Falls back to in-memory when KV env vars aren't set (local dev without KV)
const inMemory = new Map<string, { value: unknown; expiresAt: number }>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv } = await import('@vercel/kv');
    return await kv.get<T>(key);
  }
  const entry = inMemory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { inMemory.delete(key); return null; }
  return entry.value as T;
}

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv } = await import('@vercel/kv');
    await kv.set(key, value, { ex: TTL_SECONDS });
    return;
  }
  inMemory.set(key, { value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
}
