import { Router } from "express";
import { db, applicationsTable, jobsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { resolveUser } from "../middlewares/auth";

const router = Router();

const APPLICATION_STATUSES = ["saved", "applied", "under_review", "pending", "interview_scheduled", "in_process", "rejected", "ghosted", "offer_received", "accepted", "declined"];

const STATUS_LABELS: Record<string, string> = {
  saved: "Saved",
  applied: "Applied",
  under_review: "Under Review",
  pending: "Pending",
  interview_scheduled: "Interview Scheduled",
  in_process: "In Process",
  rejected: "Rejected",
  ghosted: "Ghosted",
  offer_received: "Offer Received",
  accepted: "Accepted",
  declined: "Declined",
};

// GET /applications
router.get("/", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const apps = await db.select().from(applicationsTable)
      .where(eq(applicationsTable.userId, user.id))
      .orderBy(desc(applicationsTable.updatedAt));
    res.json(apps);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /applications/board
router.get("/board", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const apps = await db.select().from(applicationsTable)
      .where(eq(applicationsTable.userId, user.id))
      .orderBy(desc(applicationsTable.updatedAt));

    const columns = APPLICATION_STATUSES.map(status => ({
      status,
      label: STATUS_LABELS[status],
      count: apps.filter(a => a.status === status).length,
      applications: apps.filter(a => a.status === status),
    }));

    res.json({ columns });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /applications/pipeline
router.get("/pipeline", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.userId, user.id));
    const total = apps.length;

    const stages = [
      { stage: "Applied", count: apps.filter(a => ["applied", "under_review", "pending", "interview_scheduled", "in_process", "offer_received", "accepted", "declined"].includes(a.status)).length },
      { stage: "Under Review", count: apps.filter(a => ["under_review", "pending", "interview_scheduled", "in_process", "offer_received", "accepted"].includes(a.status)).length },
      { stage: "Interview", count: apps.filter(a => ["interview_scheduled", "in_process", "offer_received", "accepted"].includes(a.status)).length },
      { stage: "Offer", count: apps.filter(a => ["offer_received", "accepted"].includes(a.status)).length },
    ];

    res.json({
      stages: stages.map(s => ({
        ...s,
        conversionRate: total > 0 ? Math.round((s.count / total) * 100) : 0,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /applications
router.post("/", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const { jobId, company, role, status = "saved", appliedAt, resumeId, notes, source } = req.body;
    const [app] = await db.insert(applicationsTable).values({
      userId: user.id,
      jobId: jobId ?? null,
      company,
      role,
      status,
      appliedAt: appliedAt ? new Date(appliedAt) : null,
      resumeId: resumeId ?? null,
      notes: notes ?? null,
      source: source ?? null,
    }).returning();
    res.status(201).json(app);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /applications/:id
router.get("/:id", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const id = parseInt(req.params.id);
    const [app] = await db.select().from(applicationsTable)
      .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, user.id)));
    if (!app) { res.status(404).json({ error: "Not found" }); return; }
    res.json(app);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /applications/:id
router.patch("/:id", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const id = parseInt(req.params.id);
    const { status, notes, interviewDate, recruiterName, recruiterEmail, salaryOffered } = req.body;
    const [updated] = await db.update(applicationsTable)
      .set({
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(interviewDate !== undefined && { interviewDate: interviewDate ? new Date(interviewDate) : null }),
        ...(recruiterName !== undefined && { recruiterName }),
        ...(recruiterEmail !== undefined && { recruiterEmail }),
        ...(salaryOffered !== undefined && { salaryOffered }),
        updatedAt: new Date(),
      })
      .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, user.id)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /applications/:id
router.delete("/:id", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const id = parseInt(req.params.id);
    await db.delete(applicationsTable).where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, user.id)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
