'use client';

import { useState } from 'react';
import StepBrainDump from './StepBrainDump';
import StepConfirmItems from './StepConfirmItems';
import StepLoading from './StepLoading';
import StepResults from './StepResults';
import type { CompareResult } from '@/lib/types';

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Add items', 'Confirm', 'Comparing', 'Results'];

export default function GroceryApp() {
  const [step, setStep] = useState<Step>(1);
  const [items, setItems] = useState<string[]>([]);
  const [result, setResult] = useState<CompareResult | null>(null);

  function goTo(next: Step) {
    setStep(next);
  }

  function handleResult(data: CompareResult) {
    setResult(data);
    goTo(4);
  }

  function reset() {
    setItems([]);
    setResult(null);
    setStep(1);
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <header className="px-5 pt-7 pb-2 sticky top-0 bg-[#F8F9FA] z-10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <a href="/" className="text-gray-400 text-xl leading-none">←</a>
            <div className="flex items-center gap-0.5">
              <span className="text-xl font-extrabold tracking-tight text-gray-900">Grocery</span>
            </div>
          </div>
          <div className="flex gap-1.5 mb-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  s <= step ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 font-medium">{STEP_LABELS[step - 1]}</p>
        </div>
      </header>

      {/* Step content — keyed so CSS fadeIn fires on every step change */}
      <main className="flex-1 px-5 pb-10">
        <div className="max-w-lg mx-auto">
          <div key={step} className="step-fade">
            {step === 1 && (
              <StepBrainDump
                onNext={(i) => { setItems(i); goTo(2); }}
              />
            )}
            {step === 2 && (
              <StepConfirmItems
                items={items}
                onNext={() => goTo(3)}
                onBack={() => goTo(1)}
              />
            )}
            {step === 3 && (
              <StepLoading
                items={items}
                onResult={handleResult}
                onError={() => goTo(2)}
              />
            )}
            {step === 4 && result && (
              <StepResults result={result} onReset={reset} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
