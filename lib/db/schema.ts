import { pgTable, uuid, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const todos = pgTable('todos', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  done: boolean('done').default(false).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const reminders = pgTable('reminders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  remindAt: timestamp('remind_at', { withTimezone: true }).notNull(),
  email: text('email').notNull(),
  sent: boolean('sent').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }),
  allDay: boolean('all_day').default(false).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const grocerySessions = pgTable('grocery_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  items: jsonb('items').$type<string[]>().notNull(),
  result: jsonb('result'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
