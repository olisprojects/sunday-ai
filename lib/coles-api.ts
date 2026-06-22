import { cacheGet, cacheSet } from './price-cache';

export interface ColesProduct {
  name: string;
  price: number | null;
  size: string;
}

export async function searchItem(query: string): Promise<ColesProduct[]> {
  const cacheKey = `coles:${query.toLowerCase().trim()}`;
  const cached = await cacheGet<ColesProduct[]>(cacheKey);
  if (cached) return cached;

  const colesSearchUrl = `https://www.coles.com.au/search?q=${encodeURIComponent(query)}`;

  try {
    let html: string;

    if (process.env.SCRAPER_API_KEY) {
      const scraperUrl = `https://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(colesSearchUrl)}&country_code=au`;
      const res = await fetch(scraperUrl, { cache: 'no-store' });
      if (!res.ok) {
        console.error('[coles-api] ScraperAPI error', res.status);
        return [];
      }
      html = await res.text();
    } else {
      const { gotScraping } = await import('got-scraping');
      const response = await gotScraping({
        url: colesSearchUrl,
        responseType: 'text',
        timeout: { request: 20000 },
        headers: { Referer: 'https://www.google.com/' },
        headerGeneratorOptions: {
          browsers: [{ name: 'chrome', minVersion: 120 }],
          operatingSystems: ['windows'],
          locales: ['en-AU'],
        },
      });
      html = response.body as string;
    }

    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) {
      console.error('[coles-api] no __NEXT_DATA__ — Imperva challenge page (length', html.length, ')');
      return [];
    }

    const nextData = JSON.parse(match[1]) as Record<string, unknown>;
    const pageProps = (nextData?.props as Record<string, unknown>)?.pageProps as Record<string, unknown> | undefined;
    const searchResults = pageProps?.searchResults as Record<string, unknown> | undefined;
    const results = (searchResults?.results as Record<string, unknown>[] | undefined) ?? [];

    const products: ColesProduct[] = results.slice(0, 5).map((p) => {
      const pricing = p.pricing as Record<string, unknown> | undefined;
      const rawPrice = pricing?.now ?? pricing?.price ?? null;
      const brand = p.brand as string | undefined;
      const name = p.name as string | undefined;
      const size = p.size as string | undefined;
      return {
        name: brand ? `${brand} ${name ?? query}` : (name ?? query),
        price: rawPrice != null ? Number(rawPrice) : null,
        size: size ?? '',
      };
    });

    await cacheSet(cacheKey, products);
    return products;
  } catch (err) {
    console.error('[coles-api] error:', err);
    return [];
  }
}
