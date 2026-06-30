'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onUseItems: (items: string[]) => void;
}

export default function PantryPanel({ open, onClose, onUseItems }: Props) {
  const [items, setItems] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/pantry')
      .then(r => r.json())
      .then(data => setItems(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [open]);

  function addItem() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (items.map(i => i.toLowerCase()).includes(trimmed.toLowerCase())) {
      setInput('');
      return;
    }
    const updated = [...items, trimmed];
    setItems(updated);
    setInput('');
    fetch('/api/pantry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: trimmed }),
    })
      .then(r => r.json())
      .then(data => setItems(data.items ?? updated))
      .catch(() => {});
  }

  function removeItem(item: string) {
    const updated = items.filter(i => i !== item);
    setItems(updated);
    fetch('/api/pantry', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item }),
    })
      .then(r => r.json())
      .then(data => setItems(data.items ?? updated))
      .catch(() => {});
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.4)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* Panel */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl transition-transform duration-300 flex flex-col"
        style={{
          background: 'var(--surface)',
          maxHeight: '80vh',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              This week&apos;s list
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {items.length} item{items.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg active:scale-95 transition-all"
            style={{ background: 'var(--border)', color: 'var(--muted)' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Add input */}
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add to your list..."
              className="flex-1 h-11 px-4 rounded-xl text-sm transition-colors focus:outline-none"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            />
            <button
              onClick={addItem}
              disabled={!input.trim()}
              className="h-11 px-4 rounded-xl text-white font-semibold text-sm disabled:opacity-40 active:scale-95 transition-all"
              style={{ background: 'var(--accent)' }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {loading ? (
            <p className="text-center text-sm py-8" style={{ color: 'var(--muted)' }}>Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: 'var(--muted)' }}>
              Nothing saved yet — add items throughout the week.
            </p>
          ) : (
            <div>
              {items.map((item, i) => (
                <div
                  key={item}
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {item}
                  </span>
                  <button
                    onClick={() => removeItem(item)}
                    className="text-lg leading-none active:scale-95 transition-all"
                    style={{ color: 'var(--border)' }}
                    aria-label={`Remove ${item}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {items.length > 0 && (
          <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => { onUseItems(items); onClose(); }}
              className="w-full h-12 rounded-2xl text-white font-bold text-base active:scale-95 transition-all"
              style={{ background: 'var(--accent)' }}
            >
              Use for comparison →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
