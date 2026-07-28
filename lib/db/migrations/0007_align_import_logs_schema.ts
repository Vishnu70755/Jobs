import { sql } from "drizzle-orm";

/**
 * Phase 2: Database Schema Alignment - Import Logs Table
 * Adjust importJobStatsTable to match expected import_logs schema:
 * - Add status column
 * - Rename jobsAdded to jobs_imported
 * - Rename errorMessage to errors
 */
export async function up() {
  // Add status column
  await sql`
    ALTER TABLE import_job_stats
    ADD COLUMN IF NOT EXISTS status TEXT;
  `;

  // Rename jobsAdded to jobs_imported
  // First add the new column
  await sql`
    ALTER TABLE import_job_stats
    ADD COLUMN IF NOT EXISTS jobs_imported INTEGER;
  `;

  // Copy data from jobsAdded to jobs_imported
  await sql`
    UPDATE import_job_stats
    SET jobs_imported = jobs_added
    WHERE jobs_added IS NOT NULL;
  `;

  // Set default value for existing rows where jobs_added was NULL
  await sql`
    UPDATE import_job_stats
    SET jobs_imported = 0
    WHERE jobs_imported IS NULL;
  `;

  // Make jobs_imported NOT NULL with default 0
  await sql`
    ALTER TABLE import_job_stats
    ALTER COLUMN jobs_imported SET NOT NULL,
    ALTER COLUMN jobs_imported SET DEFAULT 0;
  `;

  // Rename errorMessage to errors
  // First add the new column
  await sql`
    ALTER TABLE import_job_stats
    ADD COLUMN IF NOT EXISTS errors TEXT;
  `;

  // Copy data from errorMessage to errors
  await sql`
    UPDATE import_job_stats
    SET errors = errorMessage
    WHERE errorMessage IS NOT NULL;
  `;
}

export async function down() {
  // Revert the changes
  // Drop the new columns
  await sql`
    ALTER TABLE import_job_stats
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS jobs_imported,
    DROP COLUMN IF EXISTS errors;
  `;
}