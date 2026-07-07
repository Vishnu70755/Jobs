import express, { Router } from "express";
import { importServiceManager } from "../../services/import";
import { resolveUser, requireAdmin } from "../../middlewares/auth";
import { eq, sql } from "drizzle-orm";
import { db, importJobsTable, importSourceConfigsTable } from "@workspace/db";

const router = Router();

// Parse JSON bodies for routes that need it
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// POST /admin/import/start - Start import process for a source or all sources
router.post("/start", resolveUser, requireAdmin, async (req, res) => {
  try {
    const source = req.body?.source;

    // Validate source if provided
    if (source !== undefined && (typeof source !== "string" || source.trim() === "")) {
      res.status(400).json({ error: "Source must be a non-empty string" });
      return;
    }

    if (source) {
      // Start import for specific source
      await importServiceManager.startImport(source as any);
      res.json({ success: true, message: `Import started for ${source}` });
    } else {
      // Start import for all sources
      await importServiceManager.startAllImports();
      res.json({ success: true, message: "Import started for all sources" });
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/import/stop - Stop import process for a source or all sources
router.post("/stop", resolveUser, requireAdmin, async (req, res) => {
  try {
    const source = req.body?.source;

    // Validate source if provided
    if (source !== undefined && (typeof source !== "string" || source.trim() === "")) {
      res.status(400).json({ error: "Source must be a non-empty string" });
      return;
    }

    if (source) {
      // Stop import for specific source
      await importServiceManager.stopImport(source as any);
      res.json({ success: true, message: `Import stopped for ${source}` });
    } else {
      // Stop import for all sources
      await importServiceManager.stopAllImports();
      res.json({ success: true, message: "Import stopped for all sources" });
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/import/status - Get current import status
router.get("/status", resolveUser, requireAdmin, async (req, res) => {
  try {
    const status = await importServiceManager.getAllStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/import/stats - Get import statistics
router.get("/stats", resolveUser, requireAdmin, async (req, res) => {
  try {
    // Get total imported jobs (sum of all newJobsAdded)
    // Get total imported jobs (sum of all newJobsAdded)
    const [{ totalImportedJobs }] = await db
      .select({ totalImportedJobs: sql<number>`coalesce(sum(${importJobsTable.newJobsAdded}), 0)` })
      .from(importJobsTable);

    // Get jobs imported today (sum of newJobsAdded for today)
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);

    const [{ jobsImportedToday }] = await db
      .select({ jobsImportedToday: sql<number>`coalesce(sum(${importJobsTable.newJobsAdded}), 0)` })
      .from(importJobsTable)
      .where(
        sql`${importJobsTable.startedAt} >= ${startOfToday} AND ${importJobsTable.startedAt} <= ${endOfToday}`
      );

    // Get active sources (count of enabled sources)
    const [{ activeSources }] = await db
      .select({ activeSources: sql<number>`count(*)` })
      .from(importSourceConfigsTable)
      .where(eq(importSourceConfigsTable.isEnabled, true));

    res.json({
      success: true,
      data: {
        totalImportedJobs: Number(totalImportedJobs),
        jobsImportedToday: Number(jobsImportedToday),
        activeSources: Number(activeSources),
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/import/scheduler/start - Start import scheduler
router.post("/scheduler/start", resolveUser, requireAdmin, async (req, res) => {
  try {
    await importServiceManager.startScheduler();
    res.json({ success: true, message: "Import scheduler started" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/import/scheduler/stop - Stop import scheduler
router.post("/scheduler/stop", resolveUser, requireAdmin, async (req, res) => {
  try {
    await importServiceManager.stopScheduler();
    res.json({ success: true, message: "Import scheduler stopped" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;