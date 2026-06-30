import { NextRequest, NextResponse } from 'next/server';

const PANTRY_KEY = 'pantry:shared';

// In-memory fallback for local dev (when Upstash env vars aren't set)
const localStore: string[] = [];

function hasRedis() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function getItems(): Promise<string[]> {
  if (!hasRedis()) return [...localStore];
  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return (await redis.get<string[]>(PANTRY_KEY)) ?? [];
}

async function saveItems(items: string[]): Promise<void> {
  if (!hasRedis()) {
    localStore.length = 0;
    localStore.push(...items);
    return;
  }
  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  await redis.set(PANTRY_KEY, items);
}

export async function GET() {
  try {
    const items = await getItems();
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[pantry] GET error:', err);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { item } = await req.json();
    if (!item || typeof item !== 'string') {
      return NextResponse.json({ error: 'item required' }, { status: 400 });
    }
    const trimmed = item.trim();
    const items = await getItems();
    if (!items.map(i => i.toLowerCase()).includes(trimmed.toLowerCase())) {
      items.push(trimmed);
      await saveItems(items);
    }
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[pantry] POST error:', err);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { item } = await req.json();
    if (!item || typeof item !== 'string') {
      return NextResponse.json({ error: 'item required' }, { status: 400 });
    }
    const items = await getItems();
    const filtered = items.filter(i => i.toLowerCase() !== item.toLowerCase().trim());
    await saveItems(filtered);
    return NextResponse.json({ items: filtered });
  } catch (err) {
    console.error('[pantry] DELETE error:', err);
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
  }
}
