import { sql } from "drizzle-orm";
import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

/**
 * Add email logs table for tracking email communications
 */
export async function up() {
  await sql`
    CREATE TABLE email_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      event TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      error TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
}

export async function down() {
  await sql`
    DROP TABLE email_logs;
  `;
}