'use client';

import { useState } from 'react';
import StepBrainDump from './StepBrainDump';
import StepLoading from './StepLoading';
import StepResults from './StepResults';
import type { CompareResult } from '@/lib/types';

type Step = 1 | 2 | 3;

const STEP_LABELS = ['Add items', 'Comparing', 'Results'];

export default function GroceryApp() {
  const [step, setStep] = useState<Step>(1);
  const [items, setItems] = useState<string[]>([]);
  const [result, setResult] = useState<CompareResult | null>(null);

  function handleResult(data: CompareResult) {
    setResult(data);
    setStep(3);
  }

  function reset() {
    setItems([]);
    setResult(null);
    setStep(1);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="px-5 pt-7 pb-2 sticky top-0 z-10" style={{ background: 'var(--background)' }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <a href="/" className="text-xl leading-none" style={{ color: 'var(--muted)' }}>←</a>
            <span className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Grocery
            </span>
          </div>
          <div className="flex gap-1.5 mb-1.5">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-all duration-500"
                style={{ background: s <= step ? 'var(--accent)' : 'var(--border)' }}
              />
            ))}
          </div>
          <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {STEP_LABELS[step - 1]}
          </p>
        </div>
      </header>

      <main className="flex-1 px-5 pb-10">
        <div className="max-w-lg mx-auto">
          <div key={step} className="step-fade">
            {step === 1 && (
              <StepBrainDump onNext={i => { setItems(i); setStep(2); }} />
            )}
            {step === 2 && (
              <StepLoading
                items={items}
                onResult={handleResult}
                onError={() => setStep(1)}
              />
            )}
            {step === 3 && result && (
              <StepResults result={result} onReset={reset} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
