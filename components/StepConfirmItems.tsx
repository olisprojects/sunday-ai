'use client';

import { useState } from 'react';

interface Props {
  items: string[];
  onNext: () => void;
  onBack: () => void;
}

export default function StepConfirmItems({ items, onNext, onBack }: Props) {
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  function toggle(item: string) {
    setConfirmed((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }

  const allConfirmed = confirmed.size === items.length && items.length > 0;
  const progress = items.length > 0 ? (confirmed.size / items.length) * 100 : 0;

  return (
    <div className="pt-6">
      <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-1">
        Confirm your list
      </h1>
      <p className="text-gray-500 text-base mb-5">
        Tap each item to confirm it.
      </p>

      {/* Progress bar — CSS transition, no JS animation loop */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400">{confirmed.size} of {items.length} confirmed</span>
          {allConfirmed && (
            <span className="text-green-600 font-semibold">All good! 🎉</span>
          )}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out origin-left"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Items — CSS animation-delay stagger, no JS animation loops */}
      <div className="flex flex-col gap-2.5 mb-6">
        {items.map((item, i) => {
          const isConfirmed = confirmed.has(item);
          return (
            <button
              key={item}
              onClick={() => toggle(item)}
              style={{ animationDelay: `${i * 40}ms` }}
              className={`step-fade w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 text-left transition-colors active:scale-[0.98] ${
                isConfirmed
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Checkbox — CSS transition for colour, scale via transform */}
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                  isConfirmed
                    ? 'border-green-500 bg-green-500 scale-110'
                    : 'border-gray-300 bg-white scale-100'
                }`}
              >
                {isConfirmed && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>

              <span
                className={`text-base font-medium transition-colors ${
                  isConfirmed ? 'text-green-800' : 'text-gray-800'
                }`}
              >
                {item}
              </span>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="h-14 px-5 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold active:scale-95 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!allConfirmed}
          className={`flex-1 h-14 rounded-2xl bg-green-500 text-white font-bold text-lg disabled:opacity-40 transition-colors shadow-lg shadow-green-500/25 active:scale-95 ${
            allConfirmed ? 'pulse-subtle' : ''
          }`}
        >
          Find Best Prices →
        </button>
      </div>
    </div>
  );
}
