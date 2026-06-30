'use client';

import { useState, useRef, useMemo, KeyboardEvent } from 'react';
import PantryPanel from './PantryPanel';

const HEADLINES = [
  "What's on the list this week?",
  "What are we feeling like this week?",
  "Let's find the best deals.",
  "What do we need from the shops?",
  "Time to fill the fridge.",
  "What's running low this week?",
  "Let's do the weekly shop.",
  "What's on the menu this week?",
  "Planning the weekly haul.",
  "Let's compare and save.",
];

interface Props {
  onNext: (items: string[]) => void;
}

export default function StepBrainDump({ onNext }: Props) {
  const headline = useMemo(() => HEADLINES[Math.floor(Math.random() * HEADLINES.length)], []);
  const [input, setInput] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [pantryOpen, setPantryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addItem(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (items.map(i => i.toLowerCase()).includes(trimmed.toLowerCase())) {
      setInput('');
      return;
    }
    setItems(prev => [...prev, trimmed]);
    setInput('');
    inputRef.current?.focus();
  }

  function removeItem(item: string) {
    setItems(prev => prev.filter(i => i !== item));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addItem(input); }
    if (e.key === 'Backspace' && input === '' && items.length > 0) {
      setItems(prev => prev.slice(0, -1));
    }
  }

  function handleUseFromPantry(pantryItems: string[]) {
    setItems(prev => {
      const existing = prev.map(i => i.toLowerCase());
      const toAdd = pantryItems.filter(i => !existing.includes(i.toLowerCase()));
      return [...prev, ...toAdd];
    });
  }

  return (
    <>
      <div className="pt-10 pb-4">
        {/* Headline */}
        <h1 className="text-3xl font-bold leading-tight mb-2" style={{ color: 'var(--foreground)' }}>
          {headline}
        </h1>
        <p className="text-base mb-8" style={{ color: 'var(--muted)' }}>
          Type an item and press Enter, then compare prices.
        </p>

        {/* Chat-style input */}
        <div className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Full cream milk..."
            autoFocus
            className="flex-1 h-14 px-5 rounded-2xl text-base transition-colors focus:outline-none shadow-sm"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--foreground)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          <button
            onClick={() => addItem(input)}
            disabled={!input.trim()}
            className="h-14 px-5 rounded-2xl text-white font-semibold text-base disabled:opacity-40 active:scale-95 transition-all"
            style={{ background: 'var(--accent)' }}
          >
            Add
          </button>
        </div>

        {/* Added items chips */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {items.map(item => (
              <div
                key={item}
                className="chip-in flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-medium"
                style={{ background: 'var(--foreground)' }}
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
        )}

        {/* Item count + pantry trigger */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {items.length > 0
              ? `${items.length} item${items.length !== 1 ? 's' : ''} added`
              : 'No items yet'}
          </p>
          <button
            onClick={() => setPantryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm active:scale-95 transition-all"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--muted)',
            }}
          >
            <span>🧺</span>
            <span>This week&apos;s list</span>
          </button>
        </div>

        {/* Compare CTA */}
        <button
          onClick={() => onNext(items)}
          disabled={items.length === 0}
          className="w-full h-14 rounded-2xl text-white font-bold text-lg disabled:opacity-30 active:scale-95 transition-all"
          style={{
            background: 'var(--accent)',
            boxShadow: '0 8px 24px rgba(124,58,237,0.2)',
          }}
        >
          Compare Prices →
        </button>
      </div>

      <PantryPanel
        open={pantryOpen}
        onClose={() => setPantryOpen(false)}
        onUseItems={handleUseFromPantry}
      />
    </>
  );
}
