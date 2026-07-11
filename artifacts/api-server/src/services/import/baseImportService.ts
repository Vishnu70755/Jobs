

import { logger } from "../../lib/logger";
import { db, importJobsTable, importJobStatsTable, importSourceConfigsTable, jobsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { ImportSourceEnum } from "@workspace/db";
import { mailService } from "../../lib/mail";
import {
  getImportCompletedEmailTemplate,
  getImportFailedEmailTemplate
} from "../../lib/email-templates";

/**
 * Base class for all import services
 */
export abstract class BaseImportService {
  protected source: ImportSourceEnum;
  protected isRunning = false;

  constructor(source: ImportSourceEnum) {
    this.source = source;
  }

  /**
   * Abstract method to be implemented by each source
   * Should return array of job objects to be imported (mock or real data)
   */
  protected abstract getMockData(): Array<any>;

  /**
   * Start the import process for this source
   * Includes logging, delay, and data processing
   */
  async scrape(): Promise<Array<any>> {
    logger.info({ source: this.source }, `Scraping ${this.source} jobs`);

    // Simulate some delay (can be overridden by subclasses if needed)
    await new Promise(resolve => setTimeout(resolve, 1000));

    return this.getMockData();
  }

  /**
   * Start the import process for this source
   */
  async startImport(): Promise<void> {
    if (this.isRunning) {
      logger.warn({ source: this.source }, "Import already running");
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    // Create import job record
    const [importJob] = await db
      .insert(importJobsTable)
      .values({
        source: this.source,
        status: "running",
        startedAt: new Date(),
      })
      .returning();

    let success = false;
    let errorMessage = "";

    try {
      logger.info({ source: this.source, importJobId: importJob.id }, "Starting import job");

      // Scrape jobs from source
      const jobs = await this.scrape();

      // Process and save jobs
      const { newJobs, duplicates, failed } = await this.processJobs(jobs);

      // Update import job with results
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      await db
        .update(importJobsTable)
        .set({
          status: "completed",
          completedAt: new Date(),
          totalJobsFound: jobs.length,
          newJobsAdded: newJobs,
          duplicateJobsSkipped: duplicates,
          failedJobs: failed,
          updatedAt: new Date(),
        })
        .where(eq(importJobsTable.id, importJob.id));

      // Record stats
      await db.insert(importJobStatsTable).values({
        importJobId: importJob.id,
        source: this.source,
        jobsFound: jobs.length,
        jobsAdded: newJobs,
        jobsSkipped: duplicates,
        jobsFailed: failed,
        durationMs,
      });

      // Update source config last run
      await db
        .update(importSourceConfigsTable)
        .set({
          lastRun: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(importSourceConfigsTable.name, this.source));

      logger.info(
        {
          source: this.source,
          importJobId: importJob.id,
          jobsFound: jobs.length,
          newJobsAdded: newJobs,
          duplicates,
          failed,
          durationMs,
        },
        "Import job completed"
      );

      success = true;
    } catch (error) {
      logger.error({ source: this.source, error }, "Import job failed");

      // Update import job with error
      await db
        .update(importJobsTable)
        .set({
          status: "failed",
          completedAt: new Date(),
          lastError: error instanceof Error ? error.message : String(error),
          updatedAt: new Date(),
        })
        .where(eq(importJobsTable.id, importJob.id));

      // Record failed stats
      await db.insert(importJobStatsTable).values({
        importJobId: importJob.id,
        source: this.source,
        jobsFound: 0,
        jobsAdded: 0,
        jobsSkipped: 0,
        jobsFailed: 1,
        durationMs: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      this.isRunning = false;
    }

    // Send email notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const startedAt = new Date(startTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        const completedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

        if (success) {
          // Fetch the updated importJob to get actual numbers
          const [jobRecord] = await db
            .select()
            .from(importJobsTable)
            .where(eq(importJobsTable.id, importJob.id));

          if (jobRecord) {
            const emailTemplate = getImportCompletedEmailTemplate(
              this.source,
              startedAt,
              completedAt,
              jobRecord.totalJobsFound ?? 0,
              jobRecord.newJobsAdded ?? 0,
              jobRecord.duplicateJobsSkipped ?? 0,
              jobRecord.failedJobs ?? 0
            );
            await mailService.sendTemplateEmail(adminEmail, emailTemplate, "import_completed");
            logger.info({ to: adminEmail, subject: emailTemplate.subject }, "Import completion email sent successfully");
          } else {
            // Fallback with placeholder data
            const emailTemplate = getImportCompletedEmailTemplate(
              this.source,
              startedAt,
              completedAt,
              0, 0, 0, 0
            );
            await mailService.sendTemplateEmail(adminEmail, emailTemplate, "import_completed");
            logger.info({ to: adminEmail, subject: emailTemplate.subject }, "Import completion email sent (placeholder)");
          }
        } else {
          const emailTemplate = getImportFailedEmailTemplate(
            this.source,
            errorMessage,
            startedAt
          );
          await mailService.sendTemplateEmail(adminEmail, emailTemplate, "import_failed");
          logger.info({ to: adminEmail, subject: emailTemplate.subject }, "Import failure email sent successfully");
        }
      } else {
        logger.warn({ source: this.source }, "ADMIN_EMAIL not set; skipping import email notification");
      }
    } catch (emailError) {
      logger.error({ error: emailError.message, to: process.env.ADMIN_EMAIL, subject: "Import Job Notification" }, "Failed to send import email notification");
    }
  }

  /**
   * Process scraped jobs: validate, deduplicate, and save to jobs table
   * @param jobs Array of raw job objects from scraper
   * @returns Object with counts of new jobs, duplicates, and failures
   */
  protected async processJobs(jobs: any[]): Promise<{
    newJobs: number;
    duplicates: number;
    failed: number;
  }> {
    let newJobs = 0;
    let duplicates = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        // Validate job data
        const validatedJob = this.validateJob(job);
        if (!validatedJob) {
          failed++;
          continue;
        }

        // Check for duplicates (based on source + applyUrl or title+company+location)
        const existing = await db.query.jobsTable.findFirst({
          where: (jobsTable, { eq, and, or }) => {
            const conditions = [];
            if (validatedJob.applyUrl) {
              conditions.push(eq(jobsTable.applyUrl, validatedJob.applyUrl));
            }
            // Fallback to title+company+location if no applyUrl
            conditions.push(
              and(
                eq(jobsTable.title, validatedJob.title),
                eq(jobsTable.company, validatedJob.company),
                eq(jobsTable.location, validatedJob.location)
              )
            );
            return or(...conditions);
          },
        });

        if (existing) {
          duplicates++;
          continue;
        }

        // Insert new job
        await db.insert(jobsTable).values({
          ...validatedJob,
          source: this.source,
          isNew: true,
          isHot: false,
        });

        newJobs++;
      } catch (error) {
        logger.error({ source: this.source, job, error }, "Failed to process job");
        failed++;
      }
    }

    return { newJobs, duplicates, failed };
  }

  /**
   * Validate and normalize job data
   * Should be overridden by subclasses if needed
   */
  protected validateJob(job: any): any | null {
    // Basic validation - must have title, company, location
    if (!job.title || !job.company || !job.location) {
      return null;
    }

    return {
      title: String(job.title).trim(),
      company: String(job.company).trim(),
      companyLogo: job.companyLogo ? String(job.companyLogo) : null,
      location: String(job.location).trim(),
      workMode: job.workMode ? String(job.workMode) : "onsite",
      experienceLevel: job.experienceLevel ? String(job.experienceLevel) : null,
      salaryMin: job.salaryMin ? parseInt(job.salaryMin, 10) : null,
      salaryMax: job.salaryMax ? parseInt(job.salaryMax, 10) : null,
      salaryCurrency: job.salaryCurrency ? String(job.salaryCurrency) : "INR",
      description: job.description ? String(job.description) : null,
      skills: Array.isArray(job.skills) ? job.skills.map((s: any) => String(s).trim()) : [],
      applyUrl: job.applyUrl ? String(job.applyUrl).trim() : null,
      postedAt: job.postedAt ? new Date(job.postedAt) : null,
      expiresAt: job.expiresAt ? new Date(job.expiresAt) : null,
    };
  }

  /**
   * Stop the import process (if applicable)
   */
  async stopImport(): Promise<void> {
    if (!this.isRunning) {
      logger.warn({ source: this.source }, "Import not running");
      return;
    }

    // For scrapers that support cancellation, implement here
    // For now, we'll just mark as stopped in the database
    logger.info({ source: this.source }, "Stopping import job");

    // Update any running jobs for this source to stopped
    await db
      .update(importJobsTable)
      .set({
        status: "stopped",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        sql`${importJobsTable.source} = ${this.source} AND ${importJobsTable.status} = 'running'`
      );

    this.isRunning = false;
  }

  /**
   * Get current status of import for this source
   */
  async getStatus(): Promise<{
    status: string;
    lastRun: Date | null;
    nextScheduledRun: Date | null;
    isRunning: boolean;
  }> {
    const [config] = await db
      .select()
      .from(importSourceConfigsTable)
      .where(eq(importSourceConfigsTable.name, this.source));

    const [latestJob] = await db
      .select()
      .from(importJobsTable)
      .where(eq(importJobsTable.source, this.source))
      .orderBy(desc(importJobsTable.startedAt))
      .limit(1);

    return {
      status: latestJob?.status ?? "idle",
      lastRun: config?.lastRun ?? null,
      nextScheduledRun: config?.nextScheduledRun ?? null,
      isRunning: this.isRunning,
    };
  }
}