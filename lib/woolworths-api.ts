export interface WoolworthsProduct {
  name: string;
  price: number;
  size: string;
}

export async function searchItem(query: string): Promise<WoolworthsProduct[]> {
  const url = `https://www.woolworths.com.au/apis/ui/Search/products?searchTerm=${encodeURIComponent(query)}&pageSize=5`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (!res.ok) return [];

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

    return products;
  } catch {
    return [];
  }
}
