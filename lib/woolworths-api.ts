import { cacheGet, cacheSet } from './price-cache';

export interface WoolworthsProduct {
  name: string;
  price: number;
  size: string;
}

export async function searchItem(query: string): Promise<WoolworthsProduct[]> {
  const cacheKey = `woolworths:${query.toLowerCase().trim()}`;
  const cached = await cacheGet<WoolworthsProduct[]>(cacheKey);
  if (cached) return cached;

  const fetchUrl = `https://www.woolworths.com.au/apis/ui/Search/products?searchTerm=${encodeURIComponent(query)}&pageSize=5`;

  try {
    const res = await fetch(fetchUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('[woolworths-api] status:', res.status, 'for query:', query);
      return [];
    }

    const data = await res.json();
    const products: WoolworthsProduct[] = [];

    for (const group of data.Products ?? []) {
      for (const p of group.Products ?? [group]) {
        const price = p.Price || p.InstorePrice;
        if (!price) continue;
        products.push({
          name: p.DisplayName || p.Name || query,
          price: Number(price),
          size: p.PackageSize || '',
        });
      }
    }

    await cacheSet(cacheKey, products);
    return products;
  } catch (err) {
    console.error('[woolworths-api] error:', err);
    return [];
  }
}
