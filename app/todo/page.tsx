'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Todo {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
  createdAt: string;
}

function TodoContent() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get('prefill') || '';

  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState(prefill);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/todo')
      .then((r) => r.json())
      .then((d) => { setTodos(d); setLoading(false); });
  }, []);

  async function addTodo() {
    if (!input.trim()) return;
    const res = await fetch('/api/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: input }),
    });
    const item = await res.json();
    setTodos((prev) => [item, ...prev]);
    setInput('');
    inputRef.current?.focus();
  }

  async function toggle(id: string, done: boolean) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !done } : t)));
    await fetch('/api/todo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, done: !done }),
    });
  }

  async function remove(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/todo?id=${id}`, { method: 'DELETE' });
  }

  const active = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <header className="px-5 pt-7 pb-4 sticky top-0 bg-[#F8F9FA] z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">←</Link>
          <div className="flex items-center gap-0.5">
            <span className="text-xl font-extrabold tracking-tight text-gray-900">To-Do</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pb-10">
        <div className="max-w-lg mx-auto pt-4">

          {/* Add input */}
          <div className="flex gap-2 mb-6">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a task…"
              className="flex-1 h-14 px-4 rounded-2xl border-2 border-gray-200 bg-white text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
            />
            <button
              onClick={addTodo}
              disabled={!input.trim()}
              className="h-14 px-5 rounded-2xl bg-green-500 text-white font-semibold text-base disabled:opacity-40 active:scale-95 transition-all"
            >
              Add
            </button>
          </div>

          {loading && (
            <p className="text-center text-gray-400 text-sm py-8">Loading…</p>
          )}

          {/* Active todos */}
          {active.length > 0 && (
            <div className="space-y-2 mb-4">
              {active.map((t) => (
                <TodoRow key={t.id} todo={t} onToggle={toggle} onDelete={remove} />
              ))}
            </div>
          )}

          {!loading && active.length === 0 && done.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gray-400 text-sm">No tasks yet — add one above</p>
            </div>
          )}

          {!loading && active.length === 0 && done.length > 0 && (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-gray-500 font-medium text-sm">All done!</p>
            </div>
          )}

          {/* Completed */}
          {done.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">
                Completed · {done.length}
              </p>
              <div className="space-y-2">
                {done.map((t) => (
                  <TodoRow key={t.id} todo={t} onToggle={toggle} onDelete={remove} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function TodoRow({ todo, onToggle, onDelete }: {
  todo: Todo;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm transition-opacity ${todo.done ? 'opacity-50' : ''}`}>
      <button
        onClick={() => onToggle(todo.id, todo.done)}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-95 ${
          todo.done ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white'
        }`}
      >
        {todo.done && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span className={`flex-1 text-base text-gray-800 ${todo.done ? 'line-through text-gray-400' : ''}`}>
        {todo.title}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        className="text-gray-300 hover:text-gray-500 active:scale-95 transition-all text-xl leading-none px-1"
        aria-label="Delete"
      >
        ×
      </button>
    </div>
  );
}

export default function TodoPage() {
  return (
    <Suspense>
      <TodoContent />
    </Suspense>
  );
}
