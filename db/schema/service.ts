import { text, integer, sqliteTable, real } from 'drizzle-orm/sqlite-core';
import { category } from './category';

export const service = sqliteTable('service', {
  id: text('id').primaryKey(),
  category_id: text('category_id').references(() => category.id, {
    onDelete: 'restrict',
    onUpdate: 'restrict',
  }),
  name: text('name'),
  description: text('description'),
  disabled: integer('disabled', { mode: 'boolean' }).notNull(),
  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .$default(() => new Date())
    .notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' })
    .$default(() => new Date())
    .notNull(),
});
