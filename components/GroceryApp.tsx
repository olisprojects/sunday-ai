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
