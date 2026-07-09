import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const emailLogsTable = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  event: text("event").notNull(),
  status: text("status").notNull().default('sent'), // sent, failed, pending
  error: text("error"),
  retryCount: integer("retry_count").notNull().default(0),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schema
export const insertEmailLogSchema = createInsertSchema(emailLogsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogsTable.$inferSelect;

// Select schema (for API responses)
export const selectEmailLogSchema = createInsertSchema(emailLogsTable);
export type SelectEmailLog = z.infer<typeof selectEmailLogSchema>;