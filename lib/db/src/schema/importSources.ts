import { pgTable, serial, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const importSourcesTable = pgTable("import_sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  status: varchar("status", { length: 20 }).default("idle"),
  todayImports: integer("today_imports").default(0),
  totalImports: integer("total_imports").default(0),
  lastImport: timestamp("last_import"),
  lastSuccess: timestamp("last_success"),
  lastFailure: timestamp("last_failure"),
  schedule: varchar("schedule", { length: 100 }),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertImportSourceSchema = createInsertSchema(importSourcesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertImportSource = z.infer<typeof insertImportSourceSchema>;
export type ImportSource = typeof importSourcesTable.$inferSelect;
