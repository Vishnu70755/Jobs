import { sql } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { migrationsTable } from "./_utils";

export async function up() {
  await sql`
    ALTER TABLE users
    ADD COLUMN last_login_at TIMESTAMP;
  `;
}

export async function down() {
  await sql`
    ALTER TABLE users
    DROP COLUMN last_login_at;
  `;
}