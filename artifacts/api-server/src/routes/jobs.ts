import { Router } from "express";
import { db, jobsTable, savedJobsTable, usersTable } from "@workspace/db";
import { eq, and, desc, ilike, or, gte, sql } from "drizzle-orm";
import { requireAuth, resolveUser } from "../middlewares/auth";

const router = Router();

// GET /jobs
router.get("/", async (req, res) => {
  try {
    const { search, location, workMode, source, postedWithin, sortBy = "latest", page = "1", limit = "20" } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let query = db.select().from(jobsTable);
    const conditions = [];

    if (search) conditions.push(or(ilike(jobsTable.title, `%${search}%`), ilike(jobsTable.company, `%${search}%`)));
    if (location) conditions.push(ilike(jobsTable.location, `%${location}%`));
    if (workMode) conditions.push(eq(jobsTable.workMode, workMode));
    if (source) conditions.push(eq(jobsTable.source, source));

    if (postedWithin) {
      const hours: Record<string, number> = { "1h": 1, "6h": 6, "12h": 12, "24h": 24, "3d": 72, "7d": 168 };
      const h = hours[postedWithin];
      if (h) conditions.push(gte(jobsTable.createdAt, new Date(Date.now() - h * 3600 * 1000)));
    }

    const baseQuery = conditions.length > 0 ? db.select().from(jobsTable).where(and(...conditions)) : db.select().from(jobsTable);

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(jobsTable).where(conditions.length > 0 ? and(...conditions) : undefined);

    const jobs = await baseQuery.orderBy(desc(jobsTable.createdAt)).offset(offset).limit(limitNum);

    res.json({ jobs, total: Number(count), page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /jobs/featured
router.get("/featured", async (req, res) => {
  try {
    const jobs = await db.select().from(jobsTable).where(eq(jobsTable.isHot, true)).orderBy(desc(jobsTable.createdAt)).limit(6);
    res.json(jobs);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /jobs/stats
router.get("/stats", async (req, res) => {
  try {
    const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(jobsTable);
    const [newTodayRow] = await db.select({ count: sql<number>`count(*)` }).from(jobsTable).where(gte(jobsTable.createdAt, new Date(Date.now() - 24 * 3600 * 1000)));
    const [newWeekRow] = await db.select({ count: sql<number>`count(*)` }).from(jobsTable).where(gte(jobsTable.createdAt, new Date(Date.now() - 7 * 24 * 3600 * 1000)));
    const [remoteRow] = await db.select({ count: sql<number>`count(*)` }).from(jobsTable).where(eq(jobsTable.workMode, "remote"));
    const [hybridRow] = await db.select({ count: sql<number>`count(*)` }).from(jobsTable).where(eq(jobsTable.workMode, "hybrid"));
    const [onsiteRow] = await db.select({ count: sql<number>`count(*)` }).from(jobsTable).where(eq(jobsTable.workMode, "onsite"));

    const sourceRows = await db.select({ source: jobsTable.source, count: sql<number>`count(*)` }).from(jobsTable).groupBy(jobsTable.source);

    res.json({
      totalJobs: Number(totalRow.count),
      newToday: Number(newTodayRow.count),
      newThisWeek: Number(newWeekRow.count),
      remoteJobs: Number(remoteRow.count),
      hybridJobs: Number(hybridRow.count),
      inOfficeJobs: Number(onsiteRow.count),
      sources: sourceRows.map(r => ({ source: r.source, count: Number(r.count) })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /jobs/saved
router.get("/saved", requireAuth, resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const saved = await db
      .select({ job: jobsTable })
      .from(savedJobsTable)
      .innerJoin(jobsTable, eq(savedJobsTable.jobId, jobsTable.id))
      .where(eq(savedJobsTable.userId, user.id));
    res.json(saved.map(r => ({ ...r.job, isSaved: true })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /jobs/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...job, isSaved: false });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /jobs/:id/similar
router.get("/:id/similar", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    const similar = await db.select().from(jobsTable)
      .where(and(ilike(jobsTable.title, `%${job.title.split(" ")[0]}%`), sql`${jobsTable.id} != ${id}`))
      .limit(4);
    res.json(similar.map(j => ({ ...j, isSaved: false })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /jobs/:id/save
router.post("/:id/save", requireAuth, resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const jobId = parseInt(req.params.id);
    await db.insert(savedJobsTable).values({ userId: user.id, jobId }).onConflictDoNothing();
    res.json({ saved: true, jobId });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /jobs/:id/save
router.delete("/:id/save", requireAuth, resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const jobId = parseInt(req.params.id);
    await db.delete(savedJobsTable).where(and(eq(savedJobsTable.userId, user.id), eq(savedJobsTable.jobId, jobId)));
    res.json({ saved: false, jobId });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
