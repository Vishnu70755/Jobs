import { Router } from "express";
import { db, resumesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { resolveUser } from "../middlewares/auth";

const router = Router();

// GET /resumes
router.get("/", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const resumes = await db.select().from(resumesTable)
      .where(eq(resumesTable.userId, user.id))
      .orderBy(desc(resumesTable.createdAt));
    res.json(resumes);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /resumes
router.post("/", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const { name, fileName, fileUrl, fileType, content, isDefault } = req.body;

    if (isDefault) {
      await db.update(resumesTable).set({ isDefault: false }).where(eq(resumesTable.userId, user.id));
    }

    const [resume] = await db.insert(resumesTable).values({
      userId: user.id,
      name,
      fileName: fileName ?? null,
      fileUrl: fileUrl ?? null,
      fileType: fileType ?? null,
      content: content ?? null,
      isDefault: isDefault ?? false,
      version: 1,
    }).returning();
    res.status(201).json(resume);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /resumes/:id
router.get("/:id", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const id = parseInt(req.params["id"] as string);
    const [resume] = await db.select().from(resumesTable).where(and(eq(resumesTable.id, id), eq(resumesTable.userId, user.id)));
    if (!resume) { res.status(404).json({ error: "Not found" }); return; }
    res.json(resume);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /resumes/:id
router.patch("/:id", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const id = parseInt(req.params["id"] as string);
    const { name, isDefault, content } = req.body;

    if (isDefault) {
      await db.update(resumesTable).set({ isDefault: false }).where(eq(resumesTable.userId, user.id));
    }

    const [updated] = await db.update(resumesTable)
      .set({
        ...(name !== undefined && { name }),
        ...(isDefault !== undefined && { isDefault }),
        ...(content !== undefined && { content }),
        updatedAt: new Date(),
      })
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, user.id)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /resumes/:id
router.delete("/:id", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const id = parseInt(req.params["id"] as string);
    await db.delete(resumesTable).where(and(eq(resumesTable.id, id), eq(resumesTable.userId, user.id)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
