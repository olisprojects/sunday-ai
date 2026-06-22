'use client';

import { useState, useRef, KeyboardEvent } from 'react';

const QUICK_ADD = [
  'Milk', 'Bread', 'Eggs', 'Chicken', 'Rice', 'Pasta',
  'Butter', 'Cheese', 'Yoghurt', 'Bananas', 'Apples', 'Coffee',
  'Olive oil', 'Onions', 'Garlic', 'Tomatoes',
];

interface Props {
  onNext: (items: string[]) => void;
}

export default function StepBrainDump({ onNext }: Props) {
  const [input, setInput] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function addItem(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (items.map((i) => i.toLowerCase()).includes(lower)) {
      setInput('');
      return;
    }
    setItems((prev) => [...prev, trimmed]);
    setInput('');
    inputRef.current?.focus();
  }

  function removeItem(item: string) {
    setItems((prev) => prev.filter((i) => i !== item));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem(input);
    }
    if (e.key === 'Backspace' && input === '' && items.length > 0) {
      setItems((prev) => prev.slice(0, -1));
    }
  }

  const isAdded = (q: string) =>
    items.map((i) => i.toLowerCase()).includes(q.toLowerCase());

  return (
    <div className="pt-6">
      <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-1">
        What&apos;s on the list this week?
      </h1>
      <p className="text-gray-500 text-base mb-6">
        Tap a chip below, or type and press Add.
      </p>

      {/* Input row */}
      <div className="flex gap-2 mb-5">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Full cream milk..."
          className="flex-1 h-14 px-4 rounded-2xl border-2 border-gray-200 bg-white text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
        />
        <button
          onClick={() => addItem(input)}
          disabled={!input.trim()}
          className="h-14 px-5 rounded-2xl bg-green-500 text-white font-semibold text-base disabled:opacity-40 active:scale-95 transition-all"
        >
          Add
        </button>
      </div>

      {/* Quick-add chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_ADD.map((q) => (
          <button
            key={q}
            onClick={() => addItem(q)}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors active:scale-95 ${
              isAdded(q)
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {isAdded(q) ? '✓ ' : '+ '}
            {q}
          </button>
        ))}
      </div>

      {/* Added items */}
      {items.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            {items.length} item{items.length !== 1 ? 's' : ''} added
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <div
                key={item}
                className="chip-in flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm font-medium"
              >
                {item}
                <button
                  onClick={() => removeItem(item)}
                  className="opacity-60 active:opacity-100 text-base leading-none ml-0.5"
                  aria-label={`Remove ${item}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => onNext(items)}
        disabled={items.length === 0}
        className="w-full h-14 rounded-2xl bg-green-500 text-white font-bold text-lg disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-green-500/25"
      >
        Compare Prices →
      </button>
    </div>
  );
}
