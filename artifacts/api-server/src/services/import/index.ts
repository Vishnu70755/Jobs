import { logger } from "../../lib/logger";
import { db } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import * as schema from "@workspace/db";
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
   * Safely select from import_source_configs table, handling both schema versions
   * @returns Array of configuration objects with normalized field names
   */
  async selectImportSourceConfigs() {
    try {
      // Try the new schema first (with "name" column)
      const result = await db
        .select({
          id: schema.importSourceConfigsTable.id,
          name: schema.importSourceConfigsTable.name,
          sourceType: schema.importSourceConfigsTable.sourceType,
          url: schema.importSourceConfigsTable.url,
          country: schema.importSourceConfigsTable.country,
          category: schema.importSourceConfigsTable.category,
          apiKey: schema.importSourceConfigsTable.apiKey,
          notes: schema.importSourceConfigsTable.notes,
          isEnabled: schema.importSourceConfigsTable.isEnabled,
          lastRun: schema.importSourceConfigsTable.lastRun,
          nextScheduledRun: schema.importSourceConfigsTable.nextScheduledRun,
          intervalMinutes: schema.importSourceConfigsTable.intervalMinutes,
          createdAt: schema.importSourceConfigsTable.createdAt,
          updatedAt: schema.importSourceConfigsTable.updatedAt
        })
        .from(schema.importSourceConfigsTable);

      return result;
    } catch (error) {
      // If that fails, try the old schema (with "source" column instead of "name")
      if (error.message && error.message.includes('column "name" does not exist')) {
        try {
          const result = await db
            .select({
              id: schema.importSourceConfigsTable.id,
              name: schema.importSourceConfigsTable.source, // Map "source" to "name"
              sourceType: sql`CAST('Job Board' AS text)`.as("sourceType"), // Default value
              url: sql`NULL`.as("url"),
              country: sql`NULL`.as("country"),
              category: sql`NULL`.as("category"),
              apiKey: sql`NULL`.as("apiKey"),
              notes: sql`NULL`.as("notes"),
              isEnabled: schema.importSourceConfigsTable.isEnabled,
              lastRun: schema.importSourceConfigsTable.lastRun,
              nextScheduledRun: schema.importSourceConfigsTable.nextScheduledRun,
              intervalMinutes: schema.importSourceConfigsTable.intervalMinutes,
              createdAt: schema.importSourceConfigsTable.createdAt,
              updatedAt: schema.importSourceConfigsTable.updatedAt
            })
            .from(schema.importSourceConfigsTable);

          return result;
        } catch (error2) {
          // If both fail, re-throw the original error
          throw error;
        }
      } else {
        // Some other error, re-throw it
        throw error;
      }
    }
  }

  /**
   * Safely insert into import_source_configs table, handling both schema versions
   */
  async insertImportSourceConfig(data: {
    name: string;
    isEnabled: boolean;
    intervalMinutes: number;
    nextScheduledRun: Date;
  }) {
    try {
      // Try the new schema first
      await db.insert(schema.importSourceConfigsTable).values({
        name: data.name,
        sourceType: "Job Board",
        url: null,
        country: null,
        category: null,
        apiKey: null,
        notes: null,
        isEnabled: data.isEnabled,
        intervalMinutes: data.intervalMinutes,
        nextScheduledRun: data.nextScheduledRun,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      // If that fails, try the old schema
      if (error.message && error.message.includes('column "name" does not exist')) {
        try {
          await db.insert(schema.importSourceConfigsTable).values({
            source: data.name, // Use "source" column instead of "name"
            isEnabled: data.isEnabled,
            intervalMinutes: data.intervalMinutes,
            // Note: other columns like sourceType, url, etc. don't exist in old schema
            // but we don't need to specify them for insert if they have defaults or are nullable
            lastRun: null,
            nextScheduledRun: data.nextScheduledRun,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } catch (error2) {
          // If both fail, re-throw the original error
          throw error;
        }
      } else {
        // Some other error, re-throw it
        throw error;
      }
    }
  }

  /**
   * Safely update in import_source_configs table, handling both schema versions
   */
  async updateImportSourceConfig(id: number, data: { nextScheduledRun: Date; updatedAt: Date }) {
    try {
      // Try the new schema first
      await db
        .update(schema.importSourceConfigsTable)
        .set({
          nextScheduledRun: data.nextScheduledRun,
          updatedAt: data.updatedAt
        })
        .where(eq(schema.importSourceConfigsTable.id, id));
    } catch (error) {
      // If that fails, try the old schema
      if (error.message && error.message.includes('column "nextScheduledRun" does not exist')) {
        try {
          await db
            .update(schema.importSourceConfigsTable)
            .set({
              next_scheduled_run: data.nextScheduledRun,
              updated_at: data.updatedAt
            })
            .where(eq(schema.importSourceConfigsTable.id, id));
        } catch (error2) {
          // If both fail, re-throw the original error
          throw error;
        }
      } else if (error.message && error.message.includes('column "name" does not exist')) {
        // This might happen if we're trying to access other fields, but for update we mainly care about the ID
        // Let's try a simpler update that just uses the ID
        try {
          await db
            .update(schema.importSourceConfigsTable)
            .set({
              nextScheduledRun: data.nextScheduledRun,
              updatedAt: data.updatedAt
            })
            .where(eq(schema.importSourceConfigsTable.id, id));
        } catch (error2) {
          // If both fail, re-throw the original error
          throw error;
        }
      } else {
        // Some other error, re-throw it
        throw error;
      }
    }
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
      const configs = await this.selectImportSourceConfigs();

      // Schedule each enabled source
      configs.forEach(config => {
        if (config.isEnabled && config.intervalMinutes > 0) {
          const cronExpression = `*/${config.intervalMinutes} * * * *`;

          const job = cron.schedule(cronExpression, async () => {
            try {
              logger.info({ source: config.name }, `Starting scheduled import for ${config.name}`);

              const service = this.getService(config.name as ImportSourceEnum);
              if (service) {
                await service.startImport();

                // Update next scheduled run
                const nextRun = new Date(Date.now() + config.intervalMinutes * 60 * 1000);
                await this.updateImportSourceConfig(config.id, {
                  nextScheduledRun: nextRun,
                  updatedAt: new Date()
                });
              }
            } catch (error) {
              logger.error({ source: config.name, error }, `Scheduled import failed for ${config.name}`);
            }
          });

          logger.info({ source: config.name, interval: config.intervalMinutes }, `Scheduled import job`);
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
    const configs = await this.selectImportSourceConfigs();
    const statusPromises = configs.map(async (config) => {
      const service = this.getService(config.name as ImportSourceEnum);
      const status = service ? await service.getStatus() : {
        status: "idle",
        lastRun: null,
        nextScheduledRun: null,
        isRunning: false
      };

      return {
        source: config.name,
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
      { name: "linkedin", isEnabled: true, intervalMinutes: 60 },
      { name: "naukri", isEnabled: true, intervalMinutes: 120 },
      { name: "glassdoor", isEnabled: true, intervalMinutes: 120 },
      { name: "indeed", isEnabled: true, intervalMinutes: 60 },
      { name: "foundit", isEnabled: true, intervalMinutes: 180 },
      { name: "shine", isEnabled: true, intervalMinutes: 180 },
      { name: "wellfound", isEnabled: true, intervalMinutes: 240 },
      { name: "internshala", isEnabled: true, intervalMinutes: 120 }
    ];

    for (const config of defaultConfigs) {
      const existing = await this.selectImportSourceConfigsByName(config.name);

      if (existing.length === 0) {
        await this.insertImportSourceConfig({
          name: config.name,
          isEnabled: config.isEnabled,
          intervalMinutes: config.intervalMinutes,
          nextScheduledRun: new Date(Date.now() + config.intervalMinutes * 60 * 1000)
        });

        logger.info({ source: config.name }, `Created default import configuration`);
      }
    }
  }

  // Get database instance for direct queries in routes
  get db() {
    return db;
  }

  /**
   * Select import source configs by name (handles both schema versions)
   */
  private async selectImportSourceConfigsByName(name: string) {
    try {
      // Try the new schema first (with "name" column)
      return await db
        .select({
          id: schema.importSourceConfigsTable.id,
          name: schema.importSourceConfigsTable.name,
          sourceType: schema.importSourceConfigsTable.sourceType,
          url: schema.importSourceConfigsTable.url,
          country: schema.importSourceConfigsTable.country,
          category: schema.importSourceConfigsTable.category,
          apiKey: schema.importSourceConfigsTable.apiKey,
          notes: schema.importSourceConfigsTable.notes,
          isEnabled: schema.importSourceConfigsTable.isEnabled,
          lastRun: schema.importSourceConfigsTable.lastRun,
          nextScheduledRun: schema.importSourceConfigsTable.nextScheduledRun,
          intervalMinutes: schema.importSourceConfigsTable.intervalMinutes,
          createdAt: schema.importSourceConfigsTable.createdAt,
          updatedAt: schema.importSourceConfigsTable.updatedAt
        })
        .from(schema.importSourceConfigsTable)
        .where(eq(schema.importSourceConfigsTable.name, name));
    } catch (error) {
      // If that fails, try the old schema (with "source" column instead of "name")
      if (error instanceof Error && error.message.includes('column "name" does not exist')) {
        return await db
          .select({
            id: schema.importSourceConfigsTable.id,
            name: schema.importSourceConfigsTable.source, // Map source->name for consistency
            sourceType: sql`'Job Board'`.as("sourceType"), // Default value
            url: schema.importSourceConfigsTable.url,
            country: schema.importSourceConfigsTable.country,
            category: schema.importSourceConfigsTable.category,
            apiKey: schema.importSourceConfigsTable.apiKey,
            notes: schema.importSourceConfigsTable.notes,
            isEnabled: schema.importSourceConfigsTable.isEnabled,
            lastRun: schema.importSourceConfigsTable.lastRun,
            nextScheduledRun: schema.importSourceConfigsTable.nextScheduledRun,
            intervalMinutes: schema.importSourceConfigsTable.intervalMinutes,
            createdAt: schema.importSourceConfigsTable.createdAt,
            updatedAt: schema.importSourceConfigsTable.updatedAt
          })
          .from(schema.importSourceConfigsTable)
          .where(eq(schema.importSourceConfigsTable.source, name)); // Use source column
      } else {
        throw error; // Re-throw if it's a different error
      }
    }
  }
}

// Export a singleton instance
export const importServiceManager = new ImportServiceManager();