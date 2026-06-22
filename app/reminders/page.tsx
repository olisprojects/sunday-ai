'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Reminder {
  id: string;
  title: string;
  remindAt: string;
  sent: boolean;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-AU', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function localDatetimeDefault() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

function RemindersContent() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get('prefill') || '';

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState(prefill);
  const [remindAt, setRemindAt] = useState(localDatetimeDefault);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState('');

  useEffect(() => {
    fetch('/api/reminders')
      .then((r) => r.json())
      .then((d) => { setReminders(d); setLoading(false); });
  }, []);

  async function addReminder() {
    if (!title.trim() || !remindAt) return;
    setSaving(true);
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, remindAt: new Date(remindAt).toISOString() }),
    });
    const item = await res.json();
    if (!item.error) {
      setReminders((prev) => [item, ...prev]);
      setTitle('');
      setRemindAt(localDatetimeDefault());
    }
    setSaving(false);
  }

  async function triggerNow() {
    setTriggering(true);
    setTriggerMsg('');
    const res = await fetch('/api/reminders/trigger', { method: 'POST' });
    const data = await res.json();
    if (data.error) {
      setTriggerMsg(`Error: ${data.error}`);
    } else if (data.total === 0) {
      setTriggerMsg('No due reminders right now.');
    } else if (data.failed > 0) {
      setTriggerMsg(`Failed: ${data.errors?.[0] || 'unknown error'}`);
    } else {
      setTriggerMsg(`Sent ${data.sent} email${data.sent !== 1 ? 's' : ''}!`);
      const updated = await fetch('/api/reminders').then((r) => r.json());
      setReminders(updated);
    }
    setTriggering(false);
    setTimeout(() => setTriggerMsg(''), 8000);
  }

  async function remove(id: string) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
  }

  const upcoming = reminders.filter((r) => !r.sent && new Date(r.remindAt) > new Date());
  const past = reminders.filter((r) => r.sent || new Date(r.remindAt) <= new Date());

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <header className="px-5 pt-7 pb-4 sticky top-0 bg-[#F8F9FA] z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">←</Link>
          <span className="text-xl font-extrabold tracking-tight text-gray-900">Reminders</span>
        </div>
      </header>

      <main className="flex-1 px-5 pb-10">
        <div className="max-w-lg mx-auto pt-4">

          {/* New reminder form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Remind me to…"
              className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:border-green-400 transition-colors"
            />
            <input
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 text-gray-700 text-base focus:outline-none focus:border-green-400 transition-colors"
            />
            <button
              onClick={addReminder}
              disabled={!title.trim() || !remindAt || saving}
              className="w-full h-12 rounded-xl bg-green-500 text-white font-bold disabled:opacity-40 active:scale-[0.99] transition-all"
            >
              {saving ? 'Saving…' : 'Set Reminder'}
            </button>
            <p className="text-xs text-center text-gray-400">You&apos;ll receive an email at the scheduled time</p>
          </div>

          {/* Manual trigger — dev only */}
          {process.env.NODE_ENV === 'development' && (
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={triggerNow}
                disabled={triggering}
                className="flex-1 h-10 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium disabled:opacity-40 active:scale-[0.99] transition-all"
              >
                {triggering ? 'Checking…' : 'Send due reminders now'}
              </button>
              {triggerMsg && <p className="text-xs text-green-600 font-medium">{triggerMsg}</p>}
            </div>
          )}

          {loading && <p className="text-center text-gray-400 text-sm py-8">Loading…</p>}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">
                Upcoming · {upcoming.length}
              </p>
              <div className="space-y-2">
                {upcoming.map((r) => (
                  <ReminderRow key={r.id} reminder={r} onDelete={remove} />
                ))}
              </div>
            </div>
          )}

          {!loading && reminders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔔</div>
              <p className="text-gray-400 text-sm">No reminders yet</p>
            </div>
          )}

          {/* Sent */}
          {past.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">Sent</p>
              <div className="space-y-2 opacity-50">
                {past.map((r) => (
                  <ReminderRow key={r.id} reminder={r} onDelete={remove} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function ReminderRow({ reminder, onDelete }: { reminder: Reminder; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm">
      <div className="text-xl select-none">🔔</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{reminder.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{fmt(reminder.remindAt)}</p>
      </div>
      <button
        onClick={() => onDelete(reminder.id)}
        className="text-gray-300 hover:text-gray-500 active:scale-95 transition-all text-xl leading-none px-1"
        aria-label="Delete"
      >
        ×
      </button>
    </div>
  );
}

export default function RemindersPage() {
  return (
    <Suspense>
      <RemindersContent />
    </Suspense>
  );
}
