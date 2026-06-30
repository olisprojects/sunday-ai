'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CompareResult } from '@/lib/types';

interface Props {
  result: CompareResult;
  onReset: () => void;
}

const STORE_LABEL: Record<string, string> = {
  woolworths: 'Woolworths',
  coles: 'Coles',
};

const WIN_COLOR  = '#3d7a55'; // outcome green — cheapest
const LOSE_COLOR = '#9a9590'; // outcome grey  — more expensive

type StoreName = 'woolworths' | 'coles';

function StoreCompareCard({
  storeName,
  comparisons,
  total,
  itemCount,
  totalItems,
  isWinner,
}: {
  storeName: StoreName;
  comparisons: CompareResult['comparisons'];
  total: string;
  itemCount: number;
  totalItems: number;
  isWinner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = STORE_LABEL[storeName];
  const priceColor = isWinner ? WIN_COLOR : LOSE_COLOR;
  const noData = itemCount === 0;
  const totalNum = parseFloat(total);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <button
        onClick={() => !noData && setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${noData ? 'cursor-default' : 'active:opacity-70'}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</span>
            {isWinner && !noData && (
              <span className="text-xs" style={{ color: WIN_COLOR }}>winner</span>
            )}
            {noData && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>no prices found</span>
            )}
          </div>
          {!noData && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {itemCount} of {totalItems} item{totalItems !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {!noData && (
          <>
            <span className="text-sm font-semibold tabular-nums flex-shrink-0" style={{ color: priceColor }}>
              ${totalNum.toFixed(2)}
            </span>
            <span
              className="text-xs leading-none flex-shrink-0 transition-transform duration-200"
              style={{ display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--muted)' }}
            >
              ▾
            </span>
          </>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && !noData && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid var(--border)' }}>
              {comparisons.map((c, i) => {
                const product = storeName === 'woolworths' ? c.woolworths : c.coles;
                const isCheapest = c.cheapest === storeName && !!product?.price;
                const price = product?.price != null ? `$${Number(product.price).toFixed(2)}` : '–';

                return (
                  <div
                    key={c.item}
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'rgba(0,0,0,0.012)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                        {c.item.charAt(0).toUpperCase() + c.item.slice(1)}
                      </p>
                      {product?.name && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted)' }}>
                          {product.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs tabular-nums" style={{ color: isCheapest ? WIN_COLOR : LOSE_COLOR }}>
                        {price}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StepResults({ result, onReset }: Props) {
  const { totals, comparisons } = result;
  const winner: StoreName = totals.cheapestOverall;
  const loser: StoreName  = winner === 'woolworths' ? 'coles' : 'woolworths';
  const winnerTotal = parseFloat(totals[winner]);
  const loserTotal  = parseFloat(totals[loser]);
  const saving      = parseFloat(totals.saving);
  const loserHasData = totals[`${loser}Count` as 'woolworthsCount' | 'colesCount'] > 0;
  const hasComparison = (totals.commonCount ?? 0) > 0;

  return (
    <div className="pt-6 space-y-3">

      {/* Winner banner */}
      <div
        className="rounded-2xl p-5 step-fade"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: `3px solid ${WIN_COLOR}`,
        }}
      >
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
          Winner this week
        </p>
        <p className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-serif)' }}>
          {STORE_LABEL[winner]}
        </p>
        <div className="flex items-baseline gap-5">
          <div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: WIN_COLOR }}>
              ${winnerTotal.toFixed(2)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{STORE_LABEL[winner]}</p>
          </div>
          {loserHasData && hasComparison && (
            <>
              <p className="text-sm" style={{ color: 'var(--border)' }}>vs</p>
              <div>
                <p className="text-2xl font-bold tabular-nums" style={{ color: LOSE_COLOR }}>
                  ${loserTotal.toFixed(2)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{STORE_LABEL[loser]}</p>
              </div>
              {saving > 0 && (
                <p className="text-xs ml-auto self-end pb-0.5" style={{ color: 'var(--muted)' }}>
                  save ${saving.toFixed(2)}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Per-store breakdown */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-2 px-0.5" style={{ color: 'var(--muted)' }}>
          Price breakdown
        </p>
        <div className="space-y-1.5">
          {(['woolworths', 'coles'] as StoreName[]).map(s => (
            <StoreCompareCard
              key={s}
              storeName={s}
              comparisons={comparisons}
              total={totals[s]}
              itemCount={totals[`${s}Count` as 'woolworthsCount' | 'colesCount']}
              totalItems={comparisons.length}
              isWinner={s === winner}
            />
          ))}
        </div>
      </div>

      <div className="text-center pt-2 pb-4">
        <button
          onClick={onReset}
          className="text-xs active:opacity-60 transition-opacity"
          style={{ color: 'var(--muted)' }}
        >
          new list
        </button>
      </div>

    </div>
  );
}
