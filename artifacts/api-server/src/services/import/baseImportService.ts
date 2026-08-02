import { Job, Resume, ATSScore } from "@workspace/db";
import { OpenAIService } from "../ai/openai";
import { SauceService } from "../sauce";
import type { Logger as PinoLogger } from "pino";
import { logger } from "../../lib/logger";
import { v4 as uuidv4 } from "uuid";
import { db, importJobsTable, importSourceConfigsTable, importJobStatsTable, importSourcesTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";

export class BaseImportService {
  protected serviceName: string;
  protected logger: PinoLogger;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.logger = logger.child({ service: `import-${serviceName}` });
  }

  async startImport() {
    const startTime = Date.now();
    let stats = {
      jobsImported: 0,
      durationMs: 0,
      status: "running" as const,
      errors: [] as string[],
    };

    // Update import_sources to running
    await db
      .update(importSourcesTable)
      .set({ status: "running", lastImport: new Date() })
      .where(eq(importSourcesTable.name, this.serviceName));

    try {
      const jobs = await this.fetchJobs();
      const validJobs = jobs.filter((job) => this.validateJob(job));

      for (const job of validJobs) {
        try {
          await this.processJob(job);
          stats.jobsImported++;
        } catch (error) {
          this.logger.error({ jobId: job.id, error: error.message }, `Failed to process job`);
          stats.errors.push(`Job ${job.id}: ${error.message}`);
        }
      }

      stats.status = "completed";
    } catch (error) {
      stats.status = "failed";
      stats.errors.push(error.message);
      this.logger.error({ error: error.message }, `Import failed for ${this.serviceName}`);
    } finally {
      stats.durationMs = Date.now() - startTime;

      // Record import stats
      await db.insert(importJobStatsTable).values({
        source: this.serviceName,
        timestamp: new Date(),
        jobsImported: stats.jobsImported,
        durationMs: stats.durationMs,
        status: stats.status,
        errors: stats.errors,
      });

      // Update import_sources with final stats
      await db
        .update(importSourcesTable)
        .set({
          status: stats.status,
          today_imports: sql`today_imports + ${stats.jobsImported}`,
          total_imports: sql`total_imports + ${stats.jobsImported}`,
          lastSuccess: stats.status === "completed" ? new Date() : null,
          lastFailure: stats.status === "failed" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(importSourcesTable.name, this.serviceName));
    }
  }

  async fetchJobs(): Promise<Job[]> {
    throw new Error("fetchJobs not implemented");
  }

  async processJob(job: Job): Promise<void> {
    throw new Error("processJob not implemented");
  }

  validateJob(job: Job): boolean {
    if (!job.title || !job.company) {
      return false;
    }

    // Basic validation
    const currentDate = new Date();
    if (
      job.postedDate &&
      job.postedDate > currentDate &&
      job.postedDate > new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    ) {
      return false;
    }

    // Skills validation
    if (job.skills && !Array.isArray(job.skills)) {
      return false;
    }

    // Salary validation
    if (job.salaryRange) {
      if (
        typeof job.salaryRange.min !== "number" ||
        typeof job.salaryRange.max !== "number" ||
        job.salaryRange.min > job.salaryRange.max
      ) {
        return false;
      }
    }

    return true;
  }

  sanitizeJobForDB(job: Job) {
    return {
      id: job.id || uuidv4(),
      source: this.serviceName,
      externalId: job.externalId || null,
      title: job.title.trim(),
      company: job.company.trim(),
      location: job.location?.trim() ?? null,
      description: job.description?.trim() ?? null,
      postedDate: job.postedDate ?? null,
      url: job.url?.trim() ?? null,
      applyUrl: job.applyUrl?.trim() ?? null,
      salaryMin:
        typeof job.salaryRange?.min === "number" ? job.salaryRange.min : null,
      salaryMax:
        typeof job.salaryRange?.max === "number" ? job.salaryRange.max : null,
      salaryCurrency: job.salaryRange?.currency ?? null,
      isRemote: job.isRemote ?? false,
      isHybrid: job.isHybrid ?? false,
      skills: Array.isArray(job.skills) ? job.skills.map((s: any) => String(s).trim()) : [],
    };
  }
}
