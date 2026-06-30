'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CompareResult } from '@/lib/types';

const MESSAGES = [
  'Checking Woolworths...',
  'Checking Coles...',
  'Comparing baskets...',
  'Finding the best deal...',
  'Almost there...',
];

interface Props {
  items: string[];
  onResult: (result: CompareResult) => void;
  onError: () => void;
}

export default function StepLoading({ items, onResult, onError }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch('/api/grocery/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        if (!cancelled) onResult(data as CompareResult);
      } catch (err) {
        if (!cancelled) setErrorMsg((err as Error).message);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [items, onResult, onError]);

  if (errorMsg) {
    return (
      <div className="pt-12 flex flex-col items-center text-center">
        <div className="text-5xl mb-6">😕</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          Couldn&apos;t fetch prices
        </h2>
        <p className="text-sm mb-8 max-w-xs" style={{ color: 'var(--muted)' }}>{errorMsg}</p>
        <button
          onClick={onError}
          className="h-12 px-6 rounded-2xl text-white font-semibold active:scale-95 transition-all"
          style={{ background: 'var(--foreground)' }}
        >
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="pt-14 flex flex-col items-center text-center">
      {/* Bouncing cart */}
      <motion.div
        animate={{ y: [0, -18, 0] }}
        transition={{ repeat: Infinity, duration: 0.75, ease: 'easeInOut' }}
        className="text-6xl mb-8 select-none"
      >
        🛒
      </motion.div>

      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
        Comparing prices
      </h2>

      <div className="h-6 overflow-hidden mb-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ color: 'var(--muted)' }}
            className="text-base"
          >
            {MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Pulsing dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.45, 1], opacity: [0.35, 1, 0.35] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.2 }}
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: 'var(--accent)' }}
          />
        ))}
      </div>

      <p className="mt-8 text-sm" style={{ color: 'var(--muted)' }}>
        Checking {items.length} item{items.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
