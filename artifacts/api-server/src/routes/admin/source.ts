import { Router } from "express";
import { db, importSourceConfigsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { resolveUser, requireAdmin } from "../../middlewares/auth";
import { mailService } from "../../lib/mail";
import {
  getSourceAddedEmailTemplate,
  getSourceUpdatedEmailTemplate,
  getSourceDeletedEmailTemplate,
  getSourceDisabledEmailTemplate,
  getSourceEnabledEmailTemplate
} from "../../lib/email-templates";
import { ImportSourceEnum } from "@workspace/db";

const router = Router();

// GET /admin/source - List all sources
router.get("/", resolveUser, requireAdmin, async (req, res) => {
  try {
    const sources = await db.select().from(importSourceConfigsTable).orderBy(importSourceConfigsTable.source);
    res.json({ sources });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/source - Add a new source
router.post("/", resolveUser, requireAdmin, async (req, res) => {
  try {
    const { source, isEnabled, intervalMinutes, config } = req.body;

    // Validate source enum
    if (!source || !Object.values(ImportSourceEnum).includes(source as ImportSourceEnum)) {
      return res.status(400).json({ error: "Invalid source" });
    }

    // Check if source already exists
    const existing = await db
      .select()
      .from(importSourceConfigsTable)
      .where(eq(importSourceConfigsTable.source, source as ImportSourceEnum))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: "Source already exists" });
    }

    // Insert new source
    const [newSource] = await db
      .insert(importSourceConfigsTable)
      .values({
        source: source as ImportSourceEnum,
        isEnabled: isEnabled ?? true,
        intervalMinutes: intervalMinutes ?? 60,
        config: config ?? {},
      })
      .returning();

    // Send email notification
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const emailTemplate = getSourceAddedEmailTemplate(
          newSource.source,
          newSource.source, // sourceType same as source for now; we might have a separate type field but not in schema
          new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        );
        await mailService.sendTemplateEmail(adminEmail, emailTemplate);
      }
    } catch (emailError) {
      console.error("Failed to send source added email:", emailError);
    }

    res.status(201).json({ source: newSource });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/source/:id - Update source
router.patch("/:id", resolveUser, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid source ID" });
    }

    const { isEnabled, intervalMinutes, config } = req.body;

    // Fetch existing source
    const [existing] = await db
      .select()
      .from(importSourceConfigsTable)
      .where(eq(importSourceConfigsTable.id, id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Source not found" });
    }

    // Update source
    const [updatedSource] = await db
      .update(importSourceConfigsTable)
      .set({
        isEnabled: isEnabled ?? existing.isEnabled,
        intervalMinutes: intervalMinutes ?? existing.intervalMinutes,
        // Only update config if provided
        ...(config !== undefined && { config }),
        updatedAt: new Date(),
      })
      .where(eq(importSourceConfigsTable.id, id))
      .returning();

    // Send email notification
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const emailTemplate = getSourceUpdatedEmailTemplate(
          updatedSource.source,
          updatedSource.source, // sourceType same as source
          new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        );
        await mailService.sendTemplateEmail(adminEmail, emailTemplate);
      }
    } catch (emailError) {
      console.error("Failed to send source updated email:", emailError);
    }

    res.json({ source: updatedSource });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/source/:id - Delete source
router.delete("/:id", resolveUser, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid source ID" });
    }

    // Fetch source before deletion for email
    const [existing] = await db
      .select()
      .from(importSourceConfigsTable)
      .where(eq(importSourceConfigsTable.id, id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Source not found" });
    }

    // Delete source
    await db.delete(importSourceConfigsTable).where(eq(importSourceConfigsTable.id, id));

    // Send email notification
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const emailTemplate = getSourceDeletedEmailTemplate(
          existing.source,
          existing.source, // sourceType same as source
          new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        );
        await mailService.sendTemplateEmail(adminEmail, emailTemplate);
      }
    } catch (emailError) {
      console.error("Failed to send source deleted email:", emailError);
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/source/:id/enable - Enable source
router.patch("/:id/enable", resolveUser, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid source ID" });
    }

    // Enable source
    const [updatedSource] = await db
      .update(importSourceConfigsTable)
      .set({ isEnabled: true, updatedAt: new Date() })
      .where(eq(importSourceConfigsTable.id, id))
      .returning();

    if (!updatedSource) {
      return res.status(404).json({ error: "Source not found" });
    }

    // Send email notification
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const emailTemplate = getSourceEnabledEmailTemplate(
          updatedSource.source,
          updatedSource.source, // sourceType same as source
          new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        );
        await mailService.sendTemplateEmail(adminEmail, emailTemplate);
      }
    } catch (emailError) {
      console.error("Failed to send source enabled email:", emailError);
    }

    res.json({ source: updatedSource });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/source/:id/disable - Disable source
router.patch("/:id/disable", resolveUser, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid source ID" });
    }

    // Disable source
    const [updatedSource] = await db
      .update(importSourceConfigsTable)
      .set({ isEnabled: false, updatedAt: new Date() })
      .where(eq(importSourceConfigsTable.id, id))
      .returning();

    if (!updatedSource) {
      return res.status(404).json({ error: "Source not found" });
    }

    // Send email notification
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const emailTemplate = getSourceDisabledEmailTemplate(
          updatedSource.source,
          updatedSource.source, // sourceType same as source
          new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        );
        await mailService.sendTemplateEmail(adminEmail, emailTemplate);
      }
    } catch (emailError) {
      console.error("Failed to send source disabled email:", emailError);
    }

    res.json({ source: updatedSource });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;