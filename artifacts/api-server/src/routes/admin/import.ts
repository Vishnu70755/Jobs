import express, { Router } from "express";
import { importServiceManager } from "../../services/import";
import { resolveUser, requireAdmin } from "../../middlewares/auth";
import { eq, sql } from "drizzle-orm";
import { db, importJobsTable, importSourceConfigsTable } from "@workspace/db";
import { mailService } from "../../lib/mail";

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

      // Send email notification
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        try {
          const emailTemplate = getImportStartedEmailTemplate(source, new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
          await mailService.sendTemplateEmail(adminEmail, emailTemplate);
          // Log success
          req.log.info({ to: adminEmail, subject: emailTemplate.subject }, "Start import email sent successfully");
        } catch (emailError) {
          // Log email error but don't fail the request
          req.log.error({ error: emailError.message, to: adminEmail, subject: "Import Jobs Started" }, "Failed to send start import email notification");
        }
      } else {
        req.log.warn({ source }, "ADMIN_EMAIL not set; skipping start import email notification");
      }

      res.json({ success: true, message: `Import started for ${source}` });
    } else {
      // Start import for all sources
      await importServiceManager.startAllImports();

      // Send email notification
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        try {
          const emailTemplate = getImportStartedEmailTemplate("All Sources", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
          await mailService.sendTemplateEmail(adminEmail, emailTemplate);
          // Log success
          req.log.info({ to: adminEmail, subject: emailTemplate.subject }, "Start import email sent successfully");
        } catch (emailError) {
          // Log email error but don't fail the request
          req.log.error({ error: emailError.message, to: adminEmail, subject: "Import Jobs Started" }, "Failed to send start import email notification");
        }
      } else {
        req.log.warn({}, "ADMIN_EMAIL not set; skipping start import email notification");
      }

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

      // Send email notification
      try {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          const emailTemplate = getImportCompletedEmailTemplate(source, new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), 0, 0, 0, 0);
          await mailService.sendTemplateEmail(adminEmail, emailTemplate);
          // Log success
          req.log.info({ to: adminEmail, subject: emailTemplate.subject }, "Stop import email sent successfully");
        }
      } catch (emailError) {
        // Log email error but don't fail the request
        req.log.error({ error: errorError.message, to: adminEmail, subject: "Import Jobs Stopped" }, "Failed to send stop import email notification");
      }

      res.json({ success: true, message: `Import stopped for ${source}` });
    } else {
      // Stop import for all sources
      await importServiceManager.stopAllImports();

      // Send email notification
      try {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          const emailTemplate = getImportCompletedEmailTemplate("All Sources", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), 0, 0, 0, 0);
          await mailService.sendTemplateEmail(adminEmail, emailTemplate);
          // Log success
          req.log.info({ to: adminEmail, subject: emailTemplate.subject }, "Stop import email sent successfully");
        }
      } catch (error) {
        // Log email error but don't fail the request
        req.log.error({ error: error.message, to: adminEmail, subject: "Import Jobs Stopped" }, "Failed to send stop import email notification");
      }

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
    // Send email notification
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminName = (req as any).dbUser?.name ?? "Admin";
      const enabledSources = await db
        .select({ source: importSourceConfigsTable.source })
        .from(importSourceConfigsTable)
        .where(eq(importSourceConfigsTable.isEnabled, true));
      const providerList = enabledSources.map(row => row.source).join(", ") || "None";
      const serverTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #2c3e50;">Job Import Scheduler Started</h2>
          <p><strong>Administrator:</strong> ${escapeHtml(adminName)} (${escapeHtml(adminEmail)})</p>
          <p><strong>Start Time:</strong> ${serverTime} IST</p>
          <p><strong>Scheduler Status:</strong> Running</p>
          <p><strong>Enabled Job Providers:</strong> ${escapeHtml(providerList)}</p>
          <p><strong>Server Time:</strong> ${serverTime}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.9em; color: #7f8c8d;">This is an automated message from Vishnu's Job Quest.</p>
        </div>
      `;
      const text = `
Job Import Scheduler Started

Administrator: ${adminName} (${adminEmail})
Start Time: ${serverTime} IST
Scheduler Status: Running
Enabled Job Providers: ${providerList}
Server Time: ${serverTime}

This is an automated message from Vishnu's Job Quest.
      `;
      await mailService.sendHtmlMail(adminEmail, "Job Import Scheduler Started - Vishnu's Job Quest", html);
      // Log success
      req.log.info({
        to: adminEmail,
        subject: "Job Import Scheduler Started - Vishnu's Job Quest",
        adminName,
        providerList,
        serverTime
      }, "Scheduler start email sent successfully");
    } catch (emailError) {
      // Log email error but don't fail the request
      req.log.error({
        error: emailError,
        to: adminEmail,
        subject: "Job Import Scheduler Started - Vishnu's Job Quest",
        adminName,
        providerList,
        serverTime
      }, "Failed to send scheduler start email notification");
    }

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
    // Send email notification
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminName = (req as any).dbUser?.name ?? "Admin";
      const serverTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #2c3e50;">Job Import Scheduler Stopped</h2>
          <p><strong>Administrator:</strong> ${escapeHtml(adminName)} (${escapeHtml(adminEmail)})</p>
          <p><strong>Stop Time:</strong> ${serverTime} IST</p>
          <p><strong>Scheduler Status:</strong> Stopped</p>
          <p><strong>Server Time:</strong> ${serverTime}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.9em; color: #7f8c8d;">This is an automated message from Vishnu's Job Quest.</p>
        </div>
      `;
      const text = `
Job Import Scheduler Stopped

Administrator: ${adminName} (${adminEmail})
Stop Time: ${serverTime} IST
Scheduler Status: Stopped
Server Time: ${serverTime}

This is an automated message from Vishnu's Job Quest.
      `;
      await mailService.sendHtmlMail(adminEmail, "Job Import Scheduler Stopped - Vishnu's Job Quest", html);
      // Log success
      req.log.info({
        to: adminEmail,
        subject: "Job Import Scheduler Stopped - Vishnu's Job Quest",
        adminName,
        serverTime
      }, "Scheduler stop email sent successfully");
    } catch (error) {
      // Log email error but don't fail the request
      req.log.error({
        error: error,
        to: adminEmail,
        subject: "Job Import Scheduler Stopped - Vishnu's Job Quest",
        adminName,
        serverTime
      }, "Failed to send scheduler stop email notification");
    }

    res.json({ success: true, message: "Import scheduler stopped" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;