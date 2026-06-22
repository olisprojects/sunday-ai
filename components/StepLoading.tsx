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
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
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
        if (!cancelled) {
          setErrorMsg((err as Error).message);
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, [items, onResult, onError]);

  if (errorMsg) {
    return (
      <div className="pt-12 flex flex-col items-center text-center">
        <div className="text-5xl mb-6">😕</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Couldn&apos;t fetch prices</h2>
        <p className="text-gray-500 text-sm mb-2 max-w-xs">{errorMsg}</p>
        <p className="text-gray-400 text-xs mb-8 max-w-xs">
          Make sure <code className="bg-gray-100 px-1 rounded">au-grocery-mcp</code> is installed globally
          (<code className="bg-gray-100 px-1 rounded">npm install -g au-grocery-mcp</code>)
        </p>
        <button
          onClick={onError}
          className="h-12 px-6 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-gray-800 active:scale-95 transition-all"
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

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Comparing prices</h2>

      <div className="h-6 overflow-hidden mb-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="text-gray-500 text-base"
          >
            {MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Pulsing dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.45, 1], opacity: [0.35, 1, 0.35] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.2 }}
            className="w-2.5 h-2.5 rounded-full bg-green-500"
          />
        ))}
      </div>

      <p className="mt-8 text-sm text-gray-400">
        Checking {items.length} item{items.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
