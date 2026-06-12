import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { resumesTable } from "./resumes";
import { jobsTable } from "./jobs";

export const atsReportsTable = pgTable("ats_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  resumeId: integer("resume_id").notNull().references(() => resumesTable.id, { onDelete: "cascade" }),
  jobId: integer("job_id").references(() => jobsTable.id, { onDelete: "set null" }),
  score: integer("score").notNull(),
  matchPercentage: integer("match_percentage").notNull(),
  missingKeywords: text("missing_keywords").array().default([]),
  presentKeywords: text("present_keywords").array().default([]),
  strengths: text("strengths").array().default([]),
  weaknesses: text("weaknesses").array().default([]),
  suggestions: text("suggestions").array().default([]),
  skillsAnalysis: jsonb("skills_analysis").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AtsReport = typeof atsReportsTable.$inferSelect;
