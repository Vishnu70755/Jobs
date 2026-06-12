import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { resolveUser } from "../middlewares/auth";

const router = Router();

// GET /notifications
router.get("/", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const unreadOnly = req.query.unreadOnly === "true";

    const notifs = await db.select().from(notificationsTable)
      .where(unreadOnly
        ? and(eq(notificationsTable.userId, user.id), eq(notificationsTable.isRead, false))
        : eq(notificationsTable.userId, user.id)
      )
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    res.json(notifs);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /notifications/:id/read
router.patch("/:id/read", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const id = parseInt(req.params.id);
    const [updated] = await db.update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, user.id)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /notifications/read-all
router.patch("/read-all", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.userId, user.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
