import { pgTable, serial, text, timestamp, integer, boolean, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { jobsTable } from "./jobs";
import { resumesTable } from "./resumes";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  jobId: integer("job_id").references(() => jobsTable.id, { onDelete: "set null" }),
  resumeId: integer("resume_id").references(() => resumesTable.id, { onDelete: "set null" }),
  company: text("company").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("saved"),
  appliedAt: timestamp("applied_at"),
  notes: text("notes"),
  interviewDate: timestamp("interview_date"),
  recruiterName: text("recruiter_name"),
  recruiterEmail: text("recruiter_email"),
  salaryOffered: integer("salary_offered"),
  interviewMode: text("interview_mode"),
  meetingLink: text("meeting_link"),
  source: text("source"),
  isTracked: boolean("is_tracked").notNull().default(false),
  isSaved: boolean("is_saved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userJobUnique: unique().on(table.userId, table.jobId),
  resumeIdx: index("resume_id_idx").on(table.resumeId),
  userIdIdx: index("user_id_idx").on(table.userId),
  jobIdIdx: index("job_id_idx").on(table.jobId),
}));

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
