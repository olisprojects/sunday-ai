import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { getDb } from '@/lib/db';
import { reminders } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { sendReminderEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  });

  const body = await req.text();
  const signature = req.headers.get('upstash-signature') ?? '';
  const isValid = await receiver.verify({ signature, body }).catch(() => false);
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { reminderId } = JSON.parse(body) as { reminderId: string };
  const [reminder] = await getDb().select().from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.sent, false)));

  if (!reminder) return NextResponse.json({ ok: true });

  await sendReminderEmail(reminder.email, reminder.title);
  await getDb().update(reminders).set({ sent: true }).where(eq(reminders.id, reminderId));
  return NextResponse.json({ ok: true });
}
