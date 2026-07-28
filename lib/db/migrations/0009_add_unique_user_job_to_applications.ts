import { sql } from "drizzle-orm";

export async function up(db) {
  await db.execute(sql`
    ALTER TABLE applications
    ADD CONSTRAINT applications_user_id_job_id_unique UNIQUE (user_id, job_id);
  `);
}

export async function down(db) {
  await db.execute(sql`
    ALTER TABLE applications
    DROP CONSTRAINT IF EXISTS applications_user_id_job_id_unique;
  `);
}