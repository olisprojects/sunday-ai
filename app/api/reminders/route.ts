import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { reminders } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await getDb().select().from(reminders)
    .where(eq(reminders.userId, userId))
    .orderBy(desc(reminders.remindAt));
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, remindAt } = await req.json();
  if (!title?.trim() || !remindAt) {
    return NextResponse.json({ error: 'title and remindAt required' }, { status: 400 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: 'No email on account' }, { status: 400 });

  const [item] = await getDb().insert(reminders).values({
    userId,
    title: title.trim(),
    remindAt: new Date(remindAt),
    email,
  }).returning();

  if (process.env.QSTASH_TOKEN && process.env.APP_URL) {
    const { Client } = await import('@upstash/qstash');
    const client = new Client({ token: process.env.QSTASH_TOKEN });
    await client.publishJSON({
      url: `${process.env.APP_URL}/api/reminders/deliver`,
      body: { reminderId: item.id },
      notBefore: Math.floor(new Date(remindAt).getTime() / 1000),
    });
  }

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await getDb().delete(reminders).where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
  return NextResponse.json({ ok: true });
}
