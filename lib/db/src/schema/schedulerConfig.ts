import { pgTable, timestamp, integer, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const schedulerConfigTable = pgTable("scheduler_config", {
  id: integer("id").primaryKey().default(1),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  status: varchar("status", { length: 20 }).default("idle"),
  jobsImportedToday: integer("jobs_imported_today").default(0),
  totalImported: integer("total_imported").default(0),
  durationMs: integer("duration_ms"),
  errors: text("errors"),
  retryCount: integer("retry_count").default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertSchedulerConfigSchema = createInsertSchema(schedulerConfigTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSchedulerConfig = z.infer<typeof insertSchedulerConfigSchema>;
export type SchedulerConfig = typeof schedulerConfigTable.$inferSelect;
