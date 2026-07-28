import { Router } from "express";
import { resolveUser, requireAdmin } from "../../middlewares/auth";
import { logger } from "../../lib/logger";
import { eq, sql, and, gte, lte, desc, ilike } from "drizzle-orm";
import { db, importSourcesTable, importSourceConfigsTable, importJobsTable, importJobStatsTable } from "@workspace/db";
import { importServiceManager, ImportSourceEnum } from "../../services/import";

const router = Router();

// GET /admin/import-sources - Get all import sources with stats
router.get("/", resolveUser, requireAdmin, async (req, res) => {
  try {
    const sources = await db.select().from(importSourcesTable).orderBy(importSourcesTable.name);
    res.json({ success: true, data: sources });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/import-sources/:id/toggle - Toggle enabled status
router.patch("/:id/toggle", resolveUser, requireAdmin, async (req, res) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid source ID" });
    }

    const [existing] = await db
      .select()
      .from(importSourcesTable)
      .where(eq(importSourcesTable.id, id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Source not found" });
    }

    const updated = await db
      .update(importSourcesTable)
      .set({ enabled: !existing.enabled, updatedAt: new Date() })
      .where(eq(importSourcesTable.id, id))
      .returning();

    res.json({ success: true, data: updated[0] });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/import-sources/:id/refresh - Trigger import for specific source
router.post("/:id/refresh", resolveUser, requireAdmin, async (req, res) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid source ID" });
    }

    const [source] = await db
      .select({ name: importSourcesTable.name })
      .from(importSourcesTable)
      .where(eq(importSourcesTable.id, id))
      .limit(1);

    if (!source) {
      return res.status(404).json({ error: "Source not found" });
    }

    // Convert the display name to the enum key: lowercase and replace spaces with underscores
    const enumKey = source.name.toLowerCase().replace(/ /g, '_') as ImportSourceEnum;
    const service = importServiceManager.getService(enumKey);

    if (service) {
      // Start import for this source
      await importServiceManager.startImport(enumKey);
      logger.info({ source: source.name }, `Started import for ${source.name}`);
    } else {
      // No service found for this source (e.g., "Company Career Pages" or "Internal Sources")
      logger.warn({ source: source.name }, `No import service found for source: ${source.name}`);
    }

    // Update last_import timestamp in import_sources
    await db
      .update(importSourcesTable)
      .set({ lastImport: new Date(), updatedAt: new Date() })
      .where(eq(importSourcesTable.id, id));

    res.json({ success: true, message: `Import triggered for ${source.name}` });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/import-sources/:id/logs - Get import logs for a source
router.get("/:id/logs", resolveUser, requireAdmin, async (req, res) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid source ID" });
    }

    const [source] = await db
      .select({ name: importSourcesTable.name })
      .from(importSourcesTable)
      .where(eq(importSourcesTable.id, id));
    if (!source) {
      return res.status(404).json({ error: "Source not found" });
    }

    // Pagination parameters
    const page = Math.max(1, parseInt((req.query.page as string) ?? "1"));
    const limit = Math.min(100, parseInt((req.query.limit as string) ?? "50")); // Max 100
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(importJobStatsTable)
      .where(sql`${importJobStatsTable.source} = ${source.name}`);

    // Get logs for this source from importJobStatsTable (used as import logs)
    const logs = await db
      .select({
        id: importJobStatsTable.id,
        source: importJobStatsTable.source,
        timestamp: importJobStatsTable.timestamp,
        jobsImported: importJobStatsTable.jobsImported,
        duration: importJobStatsTable.durationMs, // Duration in milliseconds
        status: importJobStatsTable.status,
        errors: importJobStatsTable.errors,
      })
      .from(importJobStatsTable)
      .where(sql`${importJobStatsTable.source} = ${source.name}`)
      .orderBy(desc(importJobStatsTable.timestamp))
      .limit(limit)
      .offset(offset);

    // Format the response to match expected field names
    const formattedLogs = logs.map(log => ({
      id: log.id,
      source: log.source,
      timestamp: log.timestamp,
      jobs_imported: log.jobsImported,
      duration: log.duration, // in milliseconds
      status: log.status,
      errors: log.errors
    }));

    res.json({
      success: true,
      data: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/import-sources/:id/logs/:logId/retry - Retry a failed import log
router.post("/:id/logs/:logId/retry", resolveUser, requireAdmin, async (req, res) => {
  try {
    const sourceIdParam = req.params.id;
    const logIdParam = req.params.logId;
    const sourceId = Array.isArray(sourceIdParam) ? parseInt(sourceIdParam[0]) : parseInt(sourceIdParam);
    const logId = Array.isArray(logIdParam) ? parseInt(logIdParam[0]) : parseInt(logIdParam);

    if (isNaN(sourceId) || isNaN(logId)) {
      return res.status(400).json({ error: "Invalid ID provided" });
    }

    // Verify the source exists and belongs to the specified source ID
    const [source] = await db
      .select({ name: importSourcesTable.name, id: importSourcesTable.id })
      .from(importSourcesTable)
      .where(eq(importSourcesTable.id, sourceId))
      .limit(1);

    if (!source) {
      return res.status(404).json({ error: "Source not found" });
    }

    // Get the log entry to verify it belongs to this source and is failed
    const [log] = await db
      .select({
        id: importJobStatsTable.id,
        source: importJobStatsTable.source,
        status: importJobStatsTable.status
      })
      .from(importJobStatsTable)
      .where(
        and(
          eq(importJobStatsTable.id, logId),
          ilike(importJobStatsTable.source, source.name)
        )
      )
      .limit(1);

    if (!log) {
      return res.status(404).json({ error: "Log entry not found for this source" });
    }

    // Only allow retrying failed or stopped imports
    if (log.status !== "failed" && log.status !== "stopped") {
      return res.status(400).json({ error: "Only failed or stopped imports can be retried" });
    }

    // Convert the source name to the enum key
    const enumKey = source.name.toLowerCase().replace(/ /g, '_') as ImportSourceEnum;
    const service = importServiceManager.getService(enumKey);

    if (!service) {
      return res.status(400).json({ error: `No import service available for source: ${source.name}` });
    }

    // Start the import retry
    await importServiceManager.startImport(enumKey);
    
    logger.info({ source: source.name, logId: log.id }, `Retrying import for ${source.name}`);

    res.json({ 
      success: true, 
      message: `Retry initiated for ${source.name} (log ID: ${log.id})` 
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
