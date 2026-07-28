import { Router } from "express";
import { db, jobsTable, savedJobsTable, usersTable } from "@workspace/db";
import { eq, and, desc, ilike, or, gte, sql } from "drizzle-orm";
import { requireAuth, resolveUser } from "../middlewares/auth";

const router = Router();

// GET /jobs
router.get("/", async (req, res) => {
  try {
    const { search, location, workMode, source, postedWithin, sortBy = "latest", page = "1", limit = "20" } = req.query as Record<string, string>;
    const userId = (req as any).dbUser?.id || null; // Get user ID if authenticated

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

    // Get jobs
    const jobs = await baseQuery.orderBy(desc(jobsTable.createdAt)).offset(offset).limit(limitNum);

    // For each job, check if current user has saved it
    const jobsWithSavedStatus = await Promise.all(
      jobs.map(async (job) => {
        let isSaved = false;
        if (userId) {
          const [saved] = await db
            .select({ id: savedJobsTable.id })
            .from(savedJobsTable)
            .where(
              and(
                eq(savedJobsTable.userId, userId),
                eq(savedJobsTable.jobId, job.id)
              )
            );

          isSaved = !!saved;
        }
        return {
          ...job,
          isSaved
        };
      })
    );

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(jobsTable).where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({ jobs: jobsWithSavedStatus, total: Number(count), page: pageNum, limit: limitNum });
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
    const userId = user.id;

    const saved = await db
      .select({
        id: jobsTable.id,
        title: jobsTable.title,
        company: jobsTable.company,
        companyLogo: jobsTable.companyLogo,
        location: jobsTable.location,
        workMode: jobsTable.workMode,
        experienceLevel: jobsTable.experienceLevel,
        salaryMin: jobsTable.salaryMin,
        salaryMax: jobsTable.salaryMax,
        salaryCurrency: jobsTable.salaryCurrency,
        description: jobsTable.description,
        skills: jobsTable.skills,
        source: jobsTable.source,
        applyUrl: jobsTable.applyUrl,
        isNew: jobsTable.isNew,
        isHot: jobsTable.isHot,
        matchScore: jobsTable.matchScore,
        postedAt: jobsTable.postedAt,
        expiresAt: jobsTable.expiresAt,
        createdAt: jobsTable.createdAt,
        isSaved: sql<boolean>`true`.as('isSaved')
      })
      .from(savedJobsTable)
      .innerJoin(jobsTable, eq(savedJobsTable.jobId, jobsTable.id))
      .where(eq(savedJobsTable.userId, userId));
    res.json(saved);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /jobs/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const userId = (req as any).dbUser?.id || null; // Get user ID if authenticated

    // First get the job
    const [jobResult] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
    if (!jobResult) { res.status(404).json({ error: "Not found" }); return; }

    // Check if current user has saved this job
    let isSaved = false;
    if (userId) {
      const [saved] = await db
        .select({ id: savedJobsTable.id })
        .from(savedJobsTable)
        .where(
          and(
            eq(savedJobsTable.userId, userId),
            eq(savedJobsTable.jobId, id)
          )
        );

      isSaved = !!saved;
    }

    // Return job with isSaved property
    res.json({
      ...jobResult,
      isSaved
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /jobs/:id/similar
router.get("/:id/similar", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    const userId = (req as any).dbUser?.id || null; // Get user ID if authenticated

    const similar = await db.select().from(jobsTable)
      .where(and(ilike(jobsTable.title, `%${job.title.split(" ")[0]}%`), sql`${jobsTable.id} != ${id}`))
      .limit(4);

    // For each similar job, check if the current user has saved it
    const similarWithSaved = await Promise.all(
      similar.map(async (similarJob) => {
        let isSaved = false;
        if (userId) {
          const [saved] = await db
            .select({ id: savedJobsTable.id })
            .from(savedJobsTable)
            .where(
              and(
                eq(savedJobsTable.userId, userId),
                eq(savedJobsTable.jobId, similarJob.id)
              )
            );
          isSaved = !!saved;
        }
        return {
          ...similarJob,
          isSaved
        };
      })
    );

    res.json(similarWithSaved);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /jobs/:id/save
router.post("/:id/save", requireAuth, resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const jobId = parseInt(req.params["id"] as string);
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
    const jobId = parseInt(req.params["id"] as string);
    await db.delete(savedJobsTable).where(and(eq(savedJobsTable.userId, user.id), eq(savedJobsTable.jobId, jobId)));
    res.json({ saved: false, jobId });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
