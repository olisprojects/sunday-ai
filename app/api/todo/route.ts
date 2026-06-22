import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { todos } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await getDb().select().from(todos)
    .where(eq(todos.userId, userId))
    .orderBy(desc(todos.createdAt));
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, dueDate } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const [item] = await getDb().insert(todos).values({
    userId,
    title: title.trim(),
    dueDate: dueDate ? new Date(dueDate) : null,
  }).returning();

  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, done } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const [item] = await getDb().update(todos)
    .set({ done })
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning();

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await getDb().delete(todos).where(and(eq(todos.id, id), eq(todos.userId, userId)));
  return NextResponse.json({ ok: true });
}
