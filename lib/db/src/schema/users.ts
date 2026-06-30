import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name"),
  title: text("title"),
  location: text("location"),
  skills: text("skills").array().default([]),
  experience: text("experience"),
  targetRole: text("target_role"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  phone: text("phone"),
  bio: text("bio"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  portfolio: text("portfolio"),
  role: text("role").notNull().default("user"),
  isSuspended: boolean("is_suspended").notNull().default(false),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
