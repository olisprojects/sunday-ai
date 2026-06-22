'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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

// ── Collapsible per-store comparison card ────────────────────────────────────
// Uses Framer Motion only for the height expand/collapse — no interactive elements
// inside the animated div, so no touch-event conflict.

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => !noData && setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-4 py-4 text-left active:bg-gray-50 transition-colors ${noData ? 'cursor-default' : ''}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900">{label}</span>
            {isWinner && !noData && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                Winner
              </span>
            )}
            {noData && (
              <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                {storeName === 'coles' ? 'Coming soon' : 'No prices found'}
              </span>
            )}
          </div>
          {!noData && (
            <p className="text-xs text-gray-400 mt-0.5">
              {itemCount} of {totalItems} item{totalItems !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {!noData && (
          <>
            <span className="font-bold text-base tabular-nums flex-shrink-0" style={{ color }}>
              ${totalNum.toFixed(2)}
            </span>
            {/* CSS rotate transition — no composited layer */}
            <span
              className="text-gray-300 text-lg leading-none flex-shrink-0 transition-transform duration-200"
              style={{ display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              ▾
            </span>
          </>
        )}
      </button>

      {/* Height animation on the content reveal — no interactive children, safe to use Framer Motion */}
      <AnimatePresence initial={false}>
        {open && !noData && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {comparisons.map((c, i) => {
                const product = storeName === 'woolworths' ? c.woolworths : c.coles;
                const isCheapest = c.cheapest === storeName && !!product?.price;
                const price = product?.price != null ? `$${Number(product.price).toFixed(2)}` : '–';

                return (
                  <div
                    key={c.item}
                    className={`flex items-center gap-3 px-4 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">
                        {c.item.charAt(0).toUpperCase() + c.item.slice(1)}
                      </p>
                      {product?.name && (
                        <p className="text-xs text-gray-400 truncate leading-snug mt-0.5">
                          {product.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-sm font-bold tabular-nums ${product?.price ? 'text-gray-800' : 'text-gray-300'}`}>
                        {price}
                      </span>
                      {isCheapest && (
                        <span className="text-green-500 font-bold text-xs leading-none">✓</span>
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

// ── Main results component ───────────────────────────────────────────────────

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

  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

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

  function toggleTick(item: string) {
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item); else next.add(item);
      return next;
    });
  }

  function copyList() {
    const text = [
      `Sunday.ai — ${store.label} Shopping List`,
      `Total: $${winnerTotal.toFixed(2)}${loserHasData && hasComparison ? `  (vs ${STORE_STYLE[loser].label} $${loserTotal.toFixed(2)}, save $${saving.toFixed(2)} on shared items)` : ''}`,
      '',
      ...comparisons.map((c) => {
        const product = winner === 'woolworths' ? c.woolworths : c.coles;
        const price = product?.price != null ? `$${Number(product.price).toFixed(2)}` : '–';
        return `☐  ${c.item}  —  ${product?.name || c.item}  ${price}`;
      }),
    ].join('\n');

    const confirm = () => { setCopied(true); setTimeout(() => setCopied(false), 2200); };

    // navigator.clipboard requires HTTPS or localhost — fall back to execCommand on LAN HTTP
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(confirm).catch(() => execCopy(text, confirm));
    } else {
      execCopy(text, confirm);
    }
  }

  function execCopy(text: string, onSuccess: () => void) {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;opacity:0;top:0;left:0;pointer-events:none';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try { document.execCommand('copy'); onSuccess(); } catch { /* silent fail */ }
    document.body.removeChild(el);
  }

  const tickedCount = ticked.size;

  return (
    <div className="pt-5 space-y-4">

      {/* Winner banner — cosmetic entrance animation only, no touch involvement */}
      <div
        style={{ backgroundColor: store.lightBg, borderColor: store.border }}
        className="rounded-3xl p-5 border-2 step-fade"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
              Winner this week
            </p>
            <h2 className="text-3xl font-extrabold" style={{ color: store.color }}>
              {store.emoji} {store.label}
            </h2>
          </div>
          {saving > 0 && hasComparison && (
            <div
              className="px-3 py-1.5 rounded-full text-sm font-bold text-white flex-shrink-0"
              style={{ backgroundColor: store.color }}
            >
              Save ${saving.toFixed(2)}
            </div>
          )}
        </div>

        <div className="flex items-end gap-5">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{store.label}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: store.color }}>
              ${winnerTotal.toFixed(2)}
            </p>
          </div>
          {loserHasData && hasComparison && (
            <>
              <p className="text-gray-300 text-xl pb-0.5">vs</p>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{STORE_STYLE[loser].label}</p>
                <p className="text-2xl font-bold tabular-nums text-gray-400">
                  ${loserTotal.toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Shopping list — plain buttons, no Framer Motion on interactive rows */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Your Shopping List</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {store.label} · {comparisons.length} items
              {tickedCount > 0 && (
                <span className="ml-2 text-green-600 font-medium">· {tickedCount} ticked off</span>
              )}
            </p>
          </div>
          <span className="text-xl">🧾</span>
        </div>

        <div className="divide-y divide-gray-50">
          {comparisons.map((c, i) => {
            const product = winner === 'woolworths' ? c.woolworths : c.coles;
            const price   = product?.price != null ? `$${Number(product.price).toFixed(2)}` : '–';
            const isTicked = ticked.has(c.item);

            return (
              <button
                key={c.item}
                onClick={() => toggleTick(c.item)}
                className={`w-full flex items-center gap-3.5 px-5 py-4 text-left active:bg-gray-50 transition-opacity ${
                  i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                } ${isTicked ? 'opacity-45' : 'opacity-100'}`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isTicked ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white'
                }`}>
                  {isTicked && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-base text-gray-900 leading-snug ${isTicked ? 'line-through decoration-gray-400' : ''}`}>
                    {c.item.charAt(0).toUpperCase() + c.item.slice(1)}
                  </p>
                  {product?.name && (
                    <p className="text-sm text-gray-400 truncate leading-snug mt-0.5">
                      {product.name}
                    </p>
                  )}
                </div>
                <p className="font-bold text-base tabular-nums text-gray-800 flex-shrink-0">{price}</p>
              </button>
            );
          })}
        </div>

        <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Total</span>
          <span className="text-lg font-extrabold tabular-nums" style={{ color: store.color }}>
            ${winnerTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Per-store comparison cards */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">
          Full price breakdown
        </p>
        <div className="space-y-2">
          {(['woolworths', 'coles'] as StoreName[]).map((s) => (
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

      {/* Action buttons */}
      <div className="flex gap-3 pb-4">
        <button
          onClick={copyList}
          className="flex-1 h-14 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 font-semibold active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {copied ? <span className="text-green-600 font-bold">✓ Copied!</span> : <>📋 Copy List</>}
        </button>
        <button
          onClick={onReset}
          className="flex-1 h-14 rounded-2xl bg-gray-900 text-white font-bold active:scale-95 transition-all"
        >
          New List
        </button>
      </div>
    </div>
  );
}
