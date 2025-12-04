import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const learningsTable = pgTable('learnings', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type InsertLearning = typeof learningsTable.$inferInsert
export type SelectLearning = typeof learningsTable.$inferSelect
