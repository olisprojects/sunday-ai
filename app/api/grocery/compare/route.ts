import { NextRequest, NextResponse } from 'next/server';
import { searchItem } from '@/lib/woolworths-api';
import type { CompareResult, CompareItem } from '@/lib/types';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const items: string[] = body.items;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array is required' }, { status: 400 });
  }

  try {
    const results = await Promise.all(items.map((item) => searchItem(item)));

    let woolworthsTotal = 0;
    let woolworthsCount = 0;

    const comparisons: CompareItem[] = items.map((item, i) => {
      const top = results[i][0] ?? null;
      if (top?.price) {
        woolworthsTotal += top.price;
        woolworthsCount++;
      }
      return {
        item,
        woolworths: top ? { name: top.name, price: top.price } : null,
        coles: null,
        cheapest: top ? 'woolworths' : 'unknown',
        saving: null,
      };
    });

    const result: CompareResult = {
      comparisons,
      totals: {
        woolworths: woolworthsTotal.toFixed(2),
        coles: '0.00',
        cheapestOverall: 'woolworths',
        saving: '0.00',
        woolworthsCount,
        colesCount: 0,
        commonCount: 0,
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[sunday-ai] grocery compare error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
