'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { CompareResult } from '@/lib/types';

interface Props {
  items: string[];
  onResult: (result: CompareResult) => void;
  onError: () => void;
}

export default function StepLoading({ items, onResult, onError }: Props) {
  const [errorMsg, setErrorMsg] = useState('');

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
      <div className="pt-20 flex flex-col items-center text-center">
        <p className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>
          Couldn&apos;t fetch prices
        </p>
        <p className="text-sm mb-8 max-w-xs" style={{ color: 'var(--muted)' }}>{errorMsg}</p>
        <button
          onClick={onError}
          className="text-sm active:opacity-60 transition-opacity"
          style={{ color: 'var(--muted)' }}
        >
          ← go back
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 flex flex-col items-center text-center">
      <div className="flex gap-1.5 mb-5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--foreground)' }}
          />
        ))}
      </div>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        Comparing prices
      </p>
    </div>
  );
}
