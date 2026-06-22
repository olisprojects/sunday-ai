import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { calendarEvents } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const events = await getDb().select().from(calendarEvents)
    .where(eq(calendarEvents.userId, userId))
    .orderBy(desc(calendarEvents.startAt));
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, startAt, endAt, allDay, description } = await req.json();
  if (!title?.trim() || !startAt) {
    return NextResponse.json({ error: 'title and startAt required' }, { status: 400 });
  }

  const [event] = await getDb().insert(calendarEvents).values({
    userId,
    title: title.trim(),
    startAt: new Date(startAt),
    endAt: endAt ? new Date(endAt) : null,
    allDay: Boolean(allDay),
    description: description?.trim() || null,
  }).returning();

  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await getDb().delete(calendarEvents).where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)));
  return NextResponse.json({ ok: true });
}
