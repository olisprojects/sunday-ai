import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { reminders } from '@/lib/db/schema';
import { lte, eq, and } from 'drizzle-orm';
import { Resend } from 'resend';

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const due = await getDb().select().from(reminders)
    .where(and(lte(reminders.remindAt, now), eq(reminders.sent, false)));

  const results = await Promise.allSettled(
    due.map(async (reminder) => {
      await resend.emails.send({
        from: 'Sunday.ai <reminders@sunday.ai>',
        to: reminder.email,
        subject: `Reminder: ${reminder.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#111827;margin-bottom:8px">🌿 Sunday.ai Reminder</h2>
            <p style="font-size:18px;font-weight:600;color:#111827;margin:16px 0">${reminder.title}</p>
            <p style="color:#6b7280;font-size:14px">Have a great Sunday!</p>
          </div>
        `,
      });

      await getDb().update(reminders).set({ sent: true }).where(eq(reminders.id, reminder.id));
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return NextResponse.json({ sent, failed, total: due.length });
}
