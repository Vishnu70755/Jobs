import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users.ts";
import { jobsTable } from "./jobs.ts";

export const aiChatsTable = pgTable("ai_chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  jobId: integer("job_id").references(() => jobsTable.id, { onDelete: "set null" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  mode: text("mode"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AiChat = typeof aiChatsTable.$inferSelect;
