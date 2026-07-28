import { sql } from "drizzle-orm";

export async function up(db) {
  // Create import_sources table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS import_sources (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      status VARCHAR(20) DEFAULT 'idle',
      today_imports INTEGER DEFAULT 0,
      total_imports INTEGER DEFAULT 0,
      last_import TIMESTAMP,
      last_success TIMESTAMP,
      last_failure TIMESTAMP,
      schedule VARCHAR(100),
      enabled BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Insert default rows for common job sources if they don't exist
  await db.execute(sql`
    INSERT INTO import_sources (name, status, today_imports, total_imports, schedule, enabled)
    SELECT * FROM (
      VALUES 
        ('LinkedIn', 'idle', 0, 0, '0 7 * * *', true),
        ('Indeed', 'idle', 0, 0, '0 7 * * *', true),
        ('Foundit', 'idle', 0, 0, '0 7 * * *', true),
        ('Naukri', 'idle', 0, 0, '0 7 * * *', true),
        ('Glassdoor', 'idle', 0, 0, '0 7 * * *', true),
        ('Company Career Pages', 'idle', 0, 0, '0 7 * * *', true),
        ('Internal Sources', 'idle', 0, 0, '0 7 * * *', true)
    ) AS vals(name, status, today_imports, total_imports, schedule, enabled)
    WHERE NOT EXISTS (
      SELECT 1 FROM import_sources WHERE name = vals.name
    );
  `);
}

export async function down(db) {
  await db.execute(sql`
    DROP TABLE IF EXISTS import_sources;
  `);
}
