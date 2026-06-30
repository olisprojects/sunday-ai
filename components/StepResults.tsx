'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useState } from 'react';
import type { CompareResult } from '@/lib/types';

interface Props {
  result: CompareResult;
  onReset: () => void;
}

const STORE_STYLE = {
  woolworths: { color: '#009E1B', lightBg: '#f0faf0', border: '#86efac', label: 'Woolworths', emoji: '🟢' },
  coles:      { color: '#E21C1C', lightBg: '#fff5f5', border: '#fca5a5', label: 'Coles',       emoji: '🔴' },
};

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
  const { color, label } = STORE_STYLE[storeName];
  const noData = itemCount === 0;
  const totalNum = parseFloat(total);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <button
        onClick={() => !noData && setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${noData ? 'cursor-default' : 'active:bg-gray-50'}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{label}</span>
            {isWinner && !noData && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
              >
                Winner
              </span>
            )}
            {noData && (
              <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                No prices found
              </span>
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
            <span className="font-semibold text-sm tabular-nums flex-shrink-0" style={{ color }}>
              ${totalNum.toFixed(2)}
            </span>
            <span
              className="text-sm leading-none flex-shrink-0 transition-transform duration-200"
              style={{
                display: 'inline-block',
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                color: 'var(--border)',
              }}
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
                    style={{ background: i % 2 === 0 ? 'var(--surface)' : 'rgba(0,0,0,0.015)', borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug" style={{ color: 'var(--foreground)' }}>
                        {c.item.charAt(0).toUpperCase() + c.item.slice(1)}
                      </p>
                      {product?.name && (
                        <p className="text-xs truncate leading-snug mt-0.5" style={{ color: 'var(--muted)' }}>
                          {product.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs font-semibold tabular-nums" style={{ color: product?.price ? 'var(--foreground)' : 'var(--border)' }}>
                        {price}
                      </span>
                      {isCheapest && (
                        <span className="font-bold text-xs leading-none" style={{ color: 'var(--accent)' }}>✓</span>
                      )}
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
  const store = STORE_STYLE[winner];
  const winnerTotal = parseFloat(totals[winner]);
  const loserTotal  = parseFloat(totals[loser]);
  const saving      = parseFloat(totals.saving);
  const loserHasData = totals[`${loser}Count` as 'woolworthsCount' | 'colesCount'] > 0;
  const hasComparison = (totals.commonCount ?? 0) > 0;

  useEffect(() => {
    setTimeout(() => {
      const fire = (ratio: number, opts: confetti.Options) =>
        confetti({ ...opts, particleCount: Math.floor(180 * ratio), origin: { y: 0.55 } });
      fire(0.25, { spread: 28, startVelocity: 55 });
      fire(0.2,  { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    }, 250);
  }, []);

  return (
    <div className="pt-5 space-y-3">

      {/* Winner banner */}
      <div
        style={{ backgroundColor: store.lightBg, borderColor: store.border, borderWidth: 2, borderStyle: 'solid' }}
        className="rounded-2xl p-4 step-fade"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>
              Winner this week
            </p>
            <h2 className="text-2xl font-bold" style={{ color: store.color }}>
              {store.emoji} {store.label}
            </h2>
          </div>
          {saving > 0 && hasComparison && (
            <div
              className="px-3 py-1 rounded-full text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: store.color }}
            >
              Save ${saving.toFixed(2)}
            </div>
          )}
        </div>

        <div className="flex items-end gap-4">
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>{store.label}</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: store.color }}>
              ${winnerTotal.toFixed(2)}
            </p>
          </div>
          {loserHasData && hasComparison && (
            <>
              <p className="text-base pb-0.5" style={{ color: 'var(--border)' }}>vs</p>
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>{STORE_STYLE[loser].label}</p>
                <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--muted)' }}>
                  ${loserTotal.toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Per-store breakdown */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide mb-2 px-0.5" style={{ color: 'var(--muted)' }}>
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

      {/* New list */}
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
