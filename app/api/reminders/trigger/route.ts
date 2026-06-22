import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { reminders } from '@/lib/db/schema';
import { lte, eq, and } from 'drizzle-orm';
import { Resend } from 'resend';

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resend = new Resend(process.env.RESEND_API_KEY!);
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
      const { error } = await resend.emails.send({
        from: 'Sunday.ai <onboarding@resend.dev>',
        to: reminder.email,
        subject: `Reminder: ${reminder.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#111827;margin-bottom:8px">Sunday.ai Reminder</h2>
            <p style="font-size:18px;font-weight:600;color:#111827;margin:16px 0">${reminder.title}</p>
            <p style="color:#6b7280;font-size:14px">Have a great Sunday!</p>
          </div>
        `,
      });
      if (error) throw new Error(error.message);
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
