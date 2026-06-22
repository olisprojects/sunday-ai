import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { reminders } from '@/lib/db/schema';
import { lte, eq, and } from 'drizzle-orm';
import { sendReminderEmail } from '@/lib/email';

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const due = await getDb().select().from(reminders)
    .where(and(
      eq(reminders.userId, userId),
      lte(reminders.remindAt, now),
      eq(reminders.sent, false),
    ));

  if (due.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No due reminders' });
  }

  const results = await Promise.allSettled(
    due.map(async (reminder) => {
      await sendReminderEmail(reminder.email, reminder.title);
      await getDb().update(reminders).set({ sent: true }).where(eq(reminders.id, reminder.id));
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => r.reason?.message);

  return NextResponse.json({ sent, failed, total: due.length, errors });
}
