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
import { importSourceEnum } from "@workspace/db";

const router = Router();

// GET /admin/source - List all sources
router.get("/", resolveUser, requireAdmin, async (req, res) => {
  try {
    const sources = await db.select().from(importSourceConfigsTable).orderBy(importSourceConfigsTable.name);
    res.json({ sources });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/source - Add a new source
router.post("/", resolveUser, requireAdmin, async (req, res) => {
  try {
    const { name, sourceType, url, country, category, apiKey, notes, isEnabled, intervalMinutes } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Source name is required" });
    }
    if (!sourceType) {
      return res.status(400).json({ error: "Source type is required" });
    }

    // Check if source already exists
    const existing = await db
      .select()
      .from(importSourceConfigsTable)
      .where(eq(importSourceConfigsTable.name, name))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: "Source already exists" });
    }

    // Insert new source
    const [newSource] = await db
      .insert(importSourceConfigsTable)
      .values({
        name,
        sourceType: sourceType ?? "Job Board",
        url: url ?? null,
        country: country ?? null,
        category: category ?? null,
        apiKey: apiKey ?? null,
        notes: notes ?? null,
        isEnabled: isEnabled ?? true,
        intervalMinutes: intervalMinutes ?? 60,
      })
      .returning();

    // Send email notification
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const emailTemplate = getSourceAddedEmailTemplate(
          newSource.name,
          newSource.sourceType,
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

    const { name, sourceType, url, country, category, apiKey, notes, isEnabled, intervalMinutes } = req.body;

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
        name: name ?? undefined,
        sourceType: sourceType ?? undefined,
        url: url ?? undefined,
        country: country ?? undefined,
        category: category ?? undefined,
        apiKey: apiKey ?? undefined,
        notes: notes ?? undefined,
        isEnabled: isEnabled ?? undefined,
        intervalMinutes: intervalMinutes ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(importSourceConfigsTable.id, id))
      .returning();

    // Send email notification
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const emailTemplate = getSourceUpdatedEmailTemplate(
          updatedSource.name,
          updatedSource.sourceType,
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
          existing.name,
          existing.sourceType,
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
          updatedSource.name,
          updatedSource.sourceType,
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
          updatedSource.name,
          updatedSource.sourceType,
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