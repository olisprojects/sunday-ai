import { NextRequest, NextResponse } from 'next/server';
import { searchItem as searchWoolworths } from '@/lib/woolworths-api';
import { searchItem as searchColes } from '@/lib/coles-api';
import type { CompareResult, CompareItem } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const items: string[] = body.items;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array is required' }, { status: 400 });
  }

  try {
    const [woolworthsResults, colesResults] = await Promise.all([
      Promise.all(items.map(searchWoolworths)),
      Promise.all(items.map(searchColes)),
    ]);

    let woolworthsTotal = 0;
    let woolworthsCount = 0;
    let colesTotal = 0;
    let colesCount = 0;
    let commonCount = 0;

    const comparisons: CompareItem[] = items.map((item, i) => {
      const wTop = woolworthsResults[i][0] ?? null;
      const cTop = colesResults[i][0] ?? null;

      if (wTop?.price) { woolworthsTotal += wTop.price; woolworthsCount++; }
      if (cTop?.price) { colesTotal += cTop.price; colesCount++; }
      if (wTop?.price && cTop?.price) commonCount++;

      const saving =
        wTop?.price && cTop?.price
          ? Math.abs(wTop.price - cTop.price).toFixed(2)
          : null;

      const cheapest =
        wTop?.price && cTop?.price
          ? wTop.price <= cTop.price ? 'woolworths' : 'coles'
          : wTop?.price ? 'woolworths'
          : cTop?.price ? 'coles'
          : 'unknown';

      return {
        item,
        woolworths: wTop ? { name: wTop.name, price: wTop.price } : null,
        coles: cTop ? { name: cTop.name, price: cTop.price } : null,
        cheapest,
        saving,
      };
    });

    const cheapestOverall: 'woolworths' | 'coles' =
      woolworthsTotal > 0 && colesTotal > 0
        ? woolworthsTotal <= colesTotal ? 'woolworths' : 'coles'
        : 'woolworths';

    const overallSaving =
      woolworthsTotal > 0 && colesTotal > 0
        ? Math.abs(woolworthsTotal - colesTotal).toFixed(2)
        : '0.00';

    const result: CompareResult = {
      comparisons,
      totals: {
        woolworths: woolworthsTotal.toFixed(2),
        coles: colesTotal.toFixed(2),
        cheapestOverall,
        saving: overallSaving,
        woolworthsCount,
        colesCount,
        commonCount,
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[sunday-ai] grocery compare error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
