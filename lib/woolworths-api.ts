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

  // Woolworths' Cloudflare WAF blocks all datacenter IPs (Lambda, Workers, etc.).
  // ScraperAPI routes through residential IPs to bypass this. Free tier: 1000 req/month;
  // with 48h Redis cache, actual usage is ~20-40 req/month — well within limits.
  const woolworthsUrl = `https://www.woolworths.com.au/apis/ui/Search/products?searchTerm=${encodeURIComponent(query)}&pageSize=5`;
  const scraperKey = process.env.SCRAPER_API_KEY;
  const fetchUrl = scraperKey
    ? `http://api.scraperapi.com?api_key=${scraperKey}&url=${encodeURIComponent(woolworthsUrl)}&country_code=au`
    : woolworthsUrl;

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
