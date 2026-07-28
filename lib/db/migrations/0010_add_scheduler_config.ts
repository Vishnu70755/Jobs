import { sql } from "drizzle-orm";

export async function up(db) {
  // Create scheduler_config table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS scheduler_config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      last_run TIMESTAMP,
      next_run TIMESTAMP,
      status VARCHAR(20) DEFAULT 'idle',
      jobs_imported_today INTEGER DEFAULT 0,
      total_imported INTEGER DEFAULT 0,
      duration_ms INTEGER,
      errors TEXT,
      retry_count INTEGER DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Insert default row if not exists
  await db.execute(sql`
    INSERT INTO scheduler_config (id, status, jobs_imported_today, total_imported, retry_count)
    SELECT 1, 'idle', 0, 0, 0
    WHERE NOT EXISTS (SELECT 1 FROM scheduler_config WHERE id = 1);
  `);
}

export async function down(db) {
  await db.execute(sql`
    DROP TABLE IF EXISTS scheduler_config;
  `);
}
