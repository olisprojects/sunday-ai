'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
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
  const [headline, setHeadline] = useState('');
  useEffect(() => {
    setHeadline(HEADLINES[Math.floor(Math.random() * HEADLINES.length)]);
  }, []);

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
      <div className="pt-16 pb-4">

        {/* Serif headline */}
        <h1
          className="text-3xl leading-snug mb-8 text-center"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--foreground)' }}
        >
          {headline || HEADLINES[0]}
        </h1>

        {/* Input with Add button inside */}
        <div className="relative mb-4">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Full cream milk..."
            autoFocus
            className="w-full h-14 pl-5 pr-20 rounded-2xl text-sm focus:outline-none transition-shadow"
            style={{
              background: 'var(--surface)',
              color: 'var(--foreground)',
              boxShadow: '0 1px 10px rgba(0,0,0,0.07)',
              border: '1px solid transparent',
            }}
            onFocus={e => (e.currentTarget.style.border = '1px solid var(--accent)')}
            onBlur={e => (e.currentTarget.style.border = '1px solid transparent')}
          />
          <button
            onClick={() => addItem(input)}
            disabled={!input.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 px-4 rounded-xl text-xs font-medium text-white disabled:opacity-30 active:scale-95 transition-all"
            style={{ background: 'var(--button)' }}
          >
            Add
          </button>
        </div>

        {/* Item chips */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {items.map(item => (
              <div
                key={item}
                className="chip-in flex items-center gap-1 px-3 py-1 rounded-full text-xs"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              >
                {item}
                <button
                  onClick={() => removeItem(item)}
                  className="opacity-40 active:opacity-100 leading-none ml-0.5"
                  aria-label={`Remove ${item}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pantry list — centred */}
        <div className="text-center mb-5">
          <button
            onClick={() => setPantryOpen(true)}
            className="text-xs active:opacity-60 transition-opacity"
            style={{ color: 'var(--muted)' }}
          >
            pantry list
          </button>
        </div>

        {/* Compare — ghost, fills on hover */}
        <button
          onClick={() => onNext(items)}
          disabled={items.length === 0}
          className="btn-compare w-full h-10 rounded-xl font-medium text-sm active:scale-95 transition-all"
        >
          Compare prices →
        </button>

        {/* Back */}
        <div className="text-center mt-4">
          <a href="/" className="text-xs" style={{ color: 'var(--muted)' }}>
            back
          </a>
        </div>

      </div>

      <PantryPanel
        open={pantryOpen}
        onClose={() => setPantryOpen(false)}
        onUseItems={handleUseFromPantry}
      />
    </>
  );
}
