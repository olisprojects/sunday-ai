'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

const FEATURES = [
  { href: '/grocery', icon: '🛒', title: 'Grocery', desc: 'Compare this week\'s prices' },
  { href: '/todo',    icon: '✅', title: 'To-Do',   desc: 'Tasks and chores'           },
  { href: '/reminders', icon: '🔔', title: 'Reminders', desc: 'Don\'t forget a thing'  },
  { href: '/calendar',  icon: '📅', title: 'Calendar',  desc: 'Upcoming events'         },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const { route, prefill } = await res.json();
      const url = prefill ? `${route}?prefill=${encodeURIComponent(prefill)}` : route;
      router.push(url);
    } catch {
      router.push('/grocery');
    } finally {
      setLoading(false);
    }
  }

  const firstName = user?.firstName || 'there';

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <header className="px-5 pt-7 pb-4 sticky top-0 bg-[#F8F9FA] z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <span className="text-2xl font-extrabold tracking-tight text-gray-900">Sunday</span>
            <span className="text-2xl font-extrabold tracking-tight text-green-500">.ai</span>
          </div>
          <UserButton />
        </div>
      </header>

      <main className="flex-1 px-5 pb-10">
        <div className="max-w-lg mx-auto">

          {/* Greeting */}
          <div className="pt-8 pb-6 text-center">
            <p className="text-sm text-gray-400 mb-1">{getGreeting()}</p>
            <h1 className="text-3xl font-extrabold text-gray-900">
              {firstName}&apos;s Sunday
            </h1>
          </div>

          {/* AI search bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you need this Sunday?"
                className="flex-1 h-14 px-4 rounded-2xl border-2 border-gray-200 bg-white text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="h-14 px-5 rounded-2xl bg-green-500 text-white font-semibold text-lg disabled:opacity-40 active:scale-95 transition-all"
              >
                {loading ? '…' : '→'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Try &ldquo;start my grocery list&rdquo; or &ldquo;remind me to call the school&rdquo;
            </p>
          </form>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.97] transition-transform"
              >
                <div className="text-3xl mb-2 select-none">{f.icon}</div>
                <p className="font-bold text-gray-900 text-sm">{f.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{f.desc}</p>
              </Link>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
