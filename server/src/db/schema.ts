
import { serial, text, pgTable, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';

// Define conversion status enum
export const conversionStatusEnum = pgEnum('conversion_status', ['pending', 'processing', 'completed', 'failed']);

export const videoConversionRequestsTable = pgTable('video_conversion_requests', {
  id: serial('id').primaryKey(),
  original_url: text('original_url').notNull(),
  title: text('title'),
  description: text('description'),
  status: conversionStatusEnum('status').notNull().default('pending'),
  progress_percentage: integer('progress_percentage').notNull().default(0),
  error_message: text('error_message'),
  short_video_url: text('short_video_url'),
  download_url: text('download_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at')
});

// TypeScript types for the table schema
export type VideoConversionRequest = typeof videoConversionRequestsTable.$inferSelect;
export type NewVideoConversionRequest = typeof videoConversionRequestsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { videoConversionRequests: videoConversionRequestsTable };
