import { sql } from "drizzle-orm";

export async function up(db) {
  await db.execute(sql`
    ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS is_tracked BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_saved BOOLEAN NOT NULL DEFAULT FALSE;
  `);
}

export async function down(db) {
  await db.execute(sql`
    ALTER TABLE applications
    DROP COLUMN IF EXISTS is_tracked,
    DROP COLUMN IF EXISTS is_saved;
  `);
}