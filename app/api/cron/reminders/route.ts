import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { reminders } from '@/lib/db/schema';
import { lte, eq, and } from 'drizzle-orm';
import { sendReminderEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const due = await getDb().select().from(reminders)
    .where(and(lte(reminders.remindAt, now), eq(reminders.sent, false)));

  const results = await Promise.allSettled(
    due.map(async (reminder) => {
      await sendReminderEmail(reminder.email, reminder.title);
      await getDb().update(reminders).set({ sent: true }).where(eq(reminders.id, reminder.id));
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return NextResponse.json({ sent, failed, total: due.length });
}
