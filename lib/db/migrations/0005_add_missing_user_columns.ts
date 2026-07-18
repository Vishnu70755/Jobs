import { sql } from "drizzle-orm";

/**
 * Add missing columns to users table that are in the schema but missing in the DB
 */
export async function up() {
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS portfolio TEXT,
    ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
    ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP,
    ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
    ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP,
    ADD COLUMN IF NOT EXISTS last_session_id TEXT,
    ADD COLUMN IF NOT EXISTS admin_notification_sent BOOLEAN NOT NULL DEFAULT FALSE
  `;
}

export async function down() {
  await sql`
    ALTER TABLE users
    DROP COLUMN IF EXISTS phone,
    DROP COLUMN IF EXISTS bio,
    DROP COLUMN IF EXISTS date_of_birth,
    DROP COLUMN IF EXISTS gender,
    DROP COLUMN IF EXISTS portfolio,
    DROP COLUMN IF EXISTS email_verification_token,
    DROP COLUMN IF EXISTS email_verification_expires,
    DROP COLUMN IF EXISTS password_reset_token,
    DROP COLUMN IF EXISTS password_reset_expires,
    DROP COLUMN IF EXISTS last_session_id,
    DROP COLUMN IF EXISTS admin_notification_sent
  `;
}