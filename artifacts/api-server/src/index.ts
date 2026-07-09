import "dotenv/config";
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

  await seedIndianJobs();
  startScheduler();
});