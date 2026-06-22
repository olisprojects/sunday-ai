import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const SYSTEM = `Route user queries to one of these Sunday.ai features.
Routes:
- /grocery — grocery shopping, price comparison, shopping lists, food, supermarket
- /todo — to-do lists, tasks, chores, errands, things to do
- /reminders — reminders, alerts, don't forget, notify me
- /calendar — events, schedule, appointments, dates, meetings, plans

Respond ONLY with compact JSON (no markdown):
{"route":"/grocery"|"/todo"|"/reminders"|"/calendar","prefill":"user query simplified as a prefill hint"}`;

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ route: '/grocery' });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      system: SYSTEM,
      messages: [{ role: 'user', content: String(query) }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ route: '/grocery', prefill: query });
  }
}
