import app from "./app";
import { logger } from "./lib/logger";
import { db, jobsTable } from "@workspace/db";
import { startScheduler } from "./scheduler";
import { sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function ensureImportSourceConfigsSchema() {
  try {
    // Rename legacy "source" column to "name" if the rename hasn't happened yet
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'import_source_configs' AND column_name = 'source'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'import_source_configs' AND column_name = 'name'
        ) THEN
          ALTER TABLE import_source_configs RENAME COLUMN source TO name;
        END IF;
      END $$;
    `);

    // Ensure every column the app expects exists (safe no-ops if already present)
    await db.execute(sql`
      ALTER TABLE import_source_configs
        ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'Job Board',
        ADD COLUMN IF NOT EXISTS url TEXT,
        ADD COLUMN IF NOT EXISTS country TEXT,
        ADD COLUMN IF NOT EXISTS category TEXT,
        ADD COLUMN IF NOT EXISTS api_key TEXT,
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS jobs_imported INTEGER NOT NULL DEFAULT 0;
    `);

    logger.info("import_source_configs schema verified");
  } catch (err) {
    logger.error({ err }, "Failed to verify/repair import_source_configs schema");
  }
}

async function seedIndianJobs() {
  try {
    // Clear existing jobs to ensure only demo jobs remain
    await db.execute(sql`DELETE FROM ${jobsTable}`);

    await db.insert(jobsTable).values([
      {
        title: "Demo Job Onsite",
        company: "Demo Corp",
        location: "Bangalore, India",
        workMode: "onsite",
        experienceLevel: "Entry-level",
        salaryMin: 500000,
        salaryMax: 800000,
        salaryCurrency: "INR",
        description: "This is a demo onsite job.",
        skills: ["Demo"],
        source: "Demo",
        applyUrl: "https://example.com",
        isNew: true,
        isHot: false,
        postedAt: new Date(),
      },
      {
        title: "Demo Job Hybrid",
        company: "Demo Corp",
        location: "Hyderabad, India",
        workMode: "hybrid",
        experienceLevel: "Mid-level",
        salaryMin: 800000,
        salaryMax: 1200000,
        salaryCurrency: "INR",
        description: "This is a demo hybrid job.",
        skills: ["Demo"],
        source: "Demo",
        applyUrl: "https://example.com",
        isNew: true,
        isHot: false,
        postedAt: new Date(),
      },
      {
        title: "Demo Job WFH",
        company: "Demo Corp",
        location: "Remote, India",
        workMode: "remote",
        experienceLevel: "Senior",
        salaryMin: 1200000,
        salaryMax: 1800000,
        salaryCurrency: "INR",
        description: "This is a demo work-from-home job.",
        skills: ["Demo"],
        source: "Demo",
        applyUrl: "https://example.com",
        isNew: true,
        isHot: false,
        postedAt: new Date(),
      },
    ]);

    logger.info("Seeded 3 demo jobs");
  } catch (err) {
    logger.warn({ err }, "Job seed skipped or failed");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  await ensureImportSourceConfigsSchema();
  await seedIndianJobs();
  startScheduler();
});