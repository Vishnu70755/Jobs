import { logger } from "../../lib/logger";
import { db, importSourceConfigsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ImportSourceEnum } from "@workspace/db";

import { LinkedInImportService } from "./linkedinImportService";
import { NaukriImportService } from "./naukriImportService";
import { GlassdoorImportService } from "./glassdoorImportService";
import { IndeedImportService } from "./indeedImportService";
import { FounditImportService } from "./founditImportService";
import { ShineImportService } from "./shineImportService";
import { WellfoundImportService } from "./wellfoundImportService";
import { InternshalaImportService } from "./internshalaImportService";

/**
 * Import Service Manager - coordinates all import services and scheduling
 */
export class ImportServiceManager {
  private services: Map<ImportSourceEnum, any> = new Map();
  private isSchedulerRunning = false;
  private schedulerNode: any = null;

  constructor() {
    // Initialize all import services
    this.services.set("linkedin", new LinkedInImportService());
    this.services.set("naukri", new NaukriImportService());
    this.services.set("glassdoor", new GlassdoorImportService());
    this.services.set("indeed", new IndeedImportService());
    this.services.set("foundit", new FounditImportService());
    this.services.set("shine", new ShineImportService());
    this.services.set("wellfound", new WellfoundImportService());
    this.services.set("internshala", new InternshalaImportService());
  }

  /**
   * Get an import service by source
   */
  getService(source: ImportSourceEnum) {
    return this.services.get(source);
  }

  /**
   * Get all available import services
   */
  getAllServices() {
    return Array.from(this.services.values());
  }

  /**
   * Start the import scheduler
   */
  async startScheduler(): Promise<void> {
    if (this.isSchedulerRunning) {
      logger.warn("Import scheduler is already running");
      return;
    }

    try {
      // Import node-cron here to avoid dependency if not used
      const cron = await import("node-cron");

      // Load source configurations from database
      const configs = await db.select().from(importSourceConfigsTable);

      // Schedule each enabled source
      configs.forEach(config => {
        if (config.isEnabled && config.intervalMinutes > 0) {
          const cronExpression = `*/${config.intervalMinutes} * * * *`;

          const job = cron.schedule(cronExpression, async () => {
            try {
              logger.info({ source: config.source }, `Starting scheduled import for ${config.source}`);

              const service = this.getService(config.source as ImportSourceEnum);
              if (service) {
                await service.startImport();

                // Update next scheduled run
                const nextRun = new Date(Date.now() + config.intervalMinutes * 60 * 1000);
                await db
                  .update(importSourceConfigsTable)
                  .set({ nextScheduledRun: nextRun, updatedAt: new Date() })
                  .where(eq(importSourceConfigsTable.id, config.id));
              }
            } catch (error) {
              logger.error({ source: config.source, error }, `Scheduled import failed for ${config.source}`);
            }
          });

          logger.info({ source: config.source, interval: config.intervalMinutes }, `Scheduled import job`);
        }
      });

      this.isSchedulerRunning = true;
      logger.info("Import scheduler started");
    } catch (error) {
      logger.error(error, "Failed to start import scheduler");
      throw error;
    }
  }

  /**
   * Stop the import scheduler
   */
  async stopScheduler(): Promise<void> {
    if (!this.isSchedulerRunning) {
      logger.warn("Import scheduler is not running");
      return;
    }

    // Stop all scheduled jobs
    // Note: node-cron doesn't have a direct way to stop all jobs without keeping references
    // In a production app, you'd want to keep track of scheduled jobs

    this.isSchedulerRunning = false;
    logger.info("Import scheduler stopped");
  }

  /**
   * Start import for a specific source immediately
   */
  async startImport(source: ImportSourceEnum): Promise<void> {
    const service = this.getService(source);
    if (!service) {
      throw new Error(`Import service not found for source: ${source}`);
    }

    await service.startImport();
  }

  /**
   * Stop import for a specific source
   */
  async stopImport(source: ImportSourceEnum): Promise<void> {
    const service = this.getService(source);
    if (!service) {
      throw new Error(`Import service not found for source: ${source}`);
    }

    await service.stopImport();
  }

  /**
   * Start import for all sources immediately
   */
  async startAllImports(): Promise<void> {
    const services = Array.from(this.services.values());
    const promises = services.map(service => service.startImport());
    await Promise.allSettled(promises);
  }

  /**
   * Stop import for all sources
   */
  async stopAllImports(): Promise<void> {
    const services = Array.from(this.services.values());
    const promises = services.map(service => service.stopImport());
    await Promise.allSettled(promises);
  }

  /**
   * Get status of all import services
   */
  async getAllStatus(): Promise<Array<{
    source: ImportSourceEnum;
    status: string;
    lastRun: Date | null;
    nextScheduledRun: Date | null;
    isRunning: boolean;
    isEnabled: boolean;
    intervalMinutes: number;
  }>> {
    const configs = await db.select().from(importSourceConfigsTable);
    const statusPromises = configs.map(async (config) => {
      const service = this.getService(config.source as ImportSourceEnum);
      const status = service ? await service.getStatus() : {
        status: "idle",
        lastRun: null,
        nextScheduledRun: null,
        isRunning: false
      };

      return {
        source: config.source,
        status: status.status,
        lastRun: status.lastRun,
        nextScheduledRun: status.nextScheduledRun,
        isRunning: status.isRunning,
        isEnabled: config.isEnabled,
        intervalMinutes: config.intervalMinutes
      };
    });

    return Promise.all(statusPromises);
  }

  /**
   * Initialize default source configurations if they don't exist
   */
  async initializeDefaultConfigs(): Promise<void> {
    const defaultConfigs = [
      { source: "linkedin", isEnabled: true, intervalMinutes: 60 },
      { source: "naukri", isEnabled: true, intervalMinutes: 120 },
      { source: "glassdoor", isEnabled: true, intervalMinutes: 120 },
      { source: "indeed", isEnabled: true, intervalMinutes: 60 },
      { source: "foundit", isEnabled: true, intervalMinutes: 180 },
      { source: "shine", isEnabled: true, intervalMinutes: 180 },
      { source: "wellfound", isEnabled: true, intervalMinutes: 240 },
      { source: "internshala", isEnabled: true, intervalMinutes: 120 }
    ];

    for (const config of defaultConfigs) {
      const existing = await db
        .select()
        .from(importSourceConfigsTable)
        .where(eq(importSourceConfigsTable.source, config.source))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(importSourceConfigsTable).values({
          source: config.source,
          isEnabled: config.isEnabled,
          intervalMinutes: config.intervalMinutes,
          config: {},
          nextScheduledRun: new Date(Date.now() + config.intervalMinutes * 60 * 1000)
        });

        logger.info({ source: config.source }, `Created default import configuration`);
      }
    }
  }

  // Get database instance for direct queries in routes
  get db() {
    return db;
  }
}

// Export a singleton instance
export const importServiceManager = new ImportServiceManager();