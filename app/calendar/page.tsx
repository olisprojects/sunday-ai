'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface CalEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  description: string | null;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function CalendarContent() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get('prefill') || '';

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState(prefill);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/calendar')
      .then((r) => r.json())
      .then((d) => { setEvents(d); setLoading(false); });
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function eventsOnDay(day: number) {
    const d = new Date(year, month, day);
    return events.filter((e) => sameDay(new Date(e.startAt), d));
  }

  async function addEvent() {
    if (!newTitle.trim() || selectedDay === null) return;
    setSaving(true);
    const startAt = new Date(year, month, selectedDay, 9, 0).toISOString();
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, startAt, allDay: true }),
    });
    const event = await res.json();
    if (!event.error) {
      setEvents((prev) => [event, ...prev]);
      setNewTitle('');
      setSelectedDay(null);
    }
    setSaving(false);
  }

  async function removeEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' });
  }

  const upcomingEvents = events
    .filter((e) => new Date(e.startAt) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <header className="px-5 pt-7 pb-4 sticky top-0 bg-[#F8F9FA] z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">←</Link>
          <span className="text-xl font-extrabold tracking-tight text-gray-900">Calendar</span>
        </div>
      </header>

      <main className="flex-1 px-5 pb-10">
        <div className="max-w-lg mx-auto pt-4">

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 active:bg-gray-100 transition-colors text-lg"
            >
              ←
            </button>
            <h2 className="text-lg font-bold text-gray-900">{MONTHS[month]} {year}</h2>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 active:bg-gray-100 transition-colors text-lg"
            >
              →
            </button>
          </div>

          {/* Calendar grid */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            {/* Day labels */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="h-12 border-b border-r border-gray-50 last:border-r-0" />;
                const isToday = sameDay(new Date(year, month, day), today);
                const dayEvents = eventsOnDay(day);
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`h-12 flex flex-col items-center justify-center border-b border-r border-gray-50 last:border-r-0 transition-colors active:bg-gray-50 relative ${
                      isSelected ? 'bg-green-50' : ''
                    }`}
                  >
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-green-500 text-white' : 'text-gray-700'
                    }`}>
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((_, j) => (
                          <span key={j} className="w-1 h-1 rounded-full bg-green-500 block" />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add event panel (shown when a day is selected) */}
          {selectedDay !== null && (
            <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4 mb-6 step-fade">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Add event — {MONTHS[month]} {selectedDay}
              </p>
              {eventsOnDay(selectedDay).map((e) => (
                <div key={e.id} className="flex items-center gap-2 mb-2">
                  <span className="flex-1 text-sm text-gray-700">{e.title}</span>
                  <button onClick={() => removeEvent(e.id)} className="text-gray-300 text-lg leading-none active:scale-95">×</button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addEvent()}
                  placeholder="Event title…"
                  className="flex-1 h-11 px-3 rounded-xl border-2 border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-green-400 transition-colors"
                />
                <button
                  onClick={addEvent}
                  disabled={!newTitle.trim() || saving}
                  className="h-11 px-4 rounded-xl bg-green-500 text-white font-semibold text-sm disabled:opacity-40 active:scale-95 transition-all"
                >
                  {saving ? '…' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {/* Upcoming events list */}
          {!loading && upcomingEvents.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">
                Upcoming
              </p>
              <div className="space-y-2">
                {upcomingEvents.map((e) => {
                  const d = new Date(e.startAt);
                  return (
                    <div key={e.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm">
                      <div className="text-center flex-shrink-0 w-10">
                        <p className="text-xs font-medium text-gray-400">{MONTHS[d.getMonth()].slice(0, 3)}</p>
                        <p className="text-lg font-extrabold text-gray-900 leading-none">{d.getDate()}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{e.title}</p>
                      </div>
                      <button onClick={() => removeEvent(e.id)} className="text-gray-300 text-xl leading-none active:scale-95 px-1">×</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && events.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-gray-400 text-sm">Tap a day to add an event</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarContent />
    </Suspense>
  );
}
