import { cacheGet, cacheSet } from './price-cache';

export interface ColesProduct {
  name: string;
  price: number | null;
  size: string;
}

const BFF_URL = 'https://www.coles.com.au/api/bff/products/search';
const DEFAULT_STORE_ID = '0584';

export async function searchItem(query: string): Promise<ColesProduct[]> {
  const cacheKey = `coles:${query.toLowerCase().trim()}`;
  const cached = await cacheGet<ColesProduct[]>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.COLES_API_KEY;
  if (!apiKey) {
    console.error('[coles-api] COLES_API_KEY not set');
    return [];
  }

  const params = new URLSearchParams({
    storeId: DEFAULT_STORE_ID,
    searchTerm: query,
    start: '0',
    sortBy: 'salesDescending',
    excludeAds: 'true',
    authenticated: 'false',
    'subscription-key': apiKey,
  });

  try {
    const res = await fetch(`${BFF_URL}?${params}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('[coles-api] status:', res.status, 'for query:', query);
      return [];
    }

    const data = await res.json();
    const results: ColesProduct[] = (data.results ?? []).slice(0, 5).map((p: Record<string, unknown>) => {
      const pricing = p.pricing as Record<string, unknown> | undefined;
      const price = pricing?.now ?? pricing?.was ?? null;
      return {
        name: (p.brand ? `${p.brand} ${p.name ?? query}` : (p.name ?? query)) as string,
        price: price != null ? Number(price) : null,
        size: (p.packageSize as string) ?? '',
      };
    });

    await cacheSet(cacheKey, results);
    return results;
  } catch (err) {
    console.error('[coles-api] error:', err);
    return [];
  }
}
