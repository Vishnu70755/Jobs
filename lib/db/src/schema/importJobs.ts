import { pgTable, serial, text, timestamp, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const importSourceEnum = pgEnum("import_source", [
  "linkedin",
  "naukri",
  "glassdoor",
  "indeed",
  "foundit",
  "shine",
  "internshala",
  "wellfound",
  "company_career"
]);

export const importStatusEnum = pgEnum("import_status", [
  "idle",
  "running",
  "completed",
  "failed",
  "stopped"
]);

export const importJobsTable = pgTable("import_jobs", {
  id: serial("id").primaryKey(),
  source: importSourceEnum("source").notNull(),
  status: importStatusEnum("status").notNull().default("idle"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalJobsFound: integer("total_jobs_found").default(0),
  newJobsAdded: integer("new_jobs_added").default(0),
  duplicateJobsSkipped: integer("duplicate_jobs_skipped").default(0),
  failedJobs: integer("failed_jobs").default(0),
  lastError: text("last_error"),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const importJobStatsTable = pgTable("import_job_stats", {
  id: serial("id").primaryKey(),
  importJobId: integer("import_job_id")
    .references(() => importJobsTable.id)
    .notNull(),
  source: importSourceEnum("source").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  jobsFound: integer("jobs_found").default(0),
  jobsAdded: integer("jobs_added").default(0),
  jobsSkipped: integer("jobs_skipped").default(0),
  jobsFailed: integer("jobs_failed").default(0),
  durationMs: integer("duration_ms"),
  errorMessage: text("error_message"),
});

export const importSourceConfigsTable = pgTable("import_source_configs", {
  id: serial("id").primaryKey(),
  source: importSourceEnum("source").notNull().unique(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  config: jsonb("config").notNull().default({}),
  lastRun: timestamp("last_run"),
  nextScheduledRun: timestamp("next_scheduled_run"),
  intervalMinutes: integer("interval_minutes").notNull().default(60),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertImportJobSchema = createInsertSchema(importJobsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertImportJob = z.infer<typeof insertImportJobSchema>;
export type ImportJob = typeof importJobsTable.$inferSelect;

export const insertImportJobStatsSchema = createInsertSchema(importJobStatsTable).omit({ id: true });
export type InsertImportJobStats = z.infer<typeof insertImportJobStatsSchema>;
export type ImportJobStats = typeof importJobStatsTable.$inferSelect;

export const insertImportSourceConfigSchema = createInsertSchema(importSourceConfigsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertImportSourceConfig = z.infer<typeof insertImportSourceConfigSchema>;
export type ImportSourceConfig = typeof importSourceConfigsTable.$inferSelect;
