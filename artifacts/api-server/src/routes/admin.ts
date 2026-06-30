import { Router } from "express";
import { db, usersTable, applicationsTable, jobsTable, resumesTable, atsReportsTable, importJobsTable, importSourceConfigsTable } from "@workspace/db";
import { eq, ilike, desc, sql } from "drizzle-orm";
import { resolveUser, requireAdmin } from "../middlewares/auth";
import importRoutes from "./admin/import";

const router = Router();

// Import routes
router.use("/import", importRoutes);

// GET /admin/stats
router.get("/stats", resolveUser, requireAdmin, async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const [[{ totalUsers }], [{ activeUsers }], [{ totalApplications }], [{ totalJobs }], [{ totalResumes }], [{ totalAtsReports }], [{ newUsersThisWeek }], [{ applicationsThisWeek }]] = await Promise.all([
      db.select({ totalUsers: sql<number>`count(*)` }).from(usersTable),
      db.select({ activeUsers: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.isSuspended, false)),
      db.select({ totalApplications: sql<number>`count(*)` }).from(applicationsTable),
      db.select({ totalJobs: sql<number>`count(*)` }).from(jobsTable),
      db.select({ totalResumes: sql<number>`count(*)` }).from(resumesTable),
      db.select({ totalAtsReports: sql<number>`count(*)` }).from(atsReportsTable),
      db.select({ newUsersThisWeek: sql<number>`count(*)` }).from(usersTable).where(sql`${usersTable.createdAt} > ${weekAgo}`),
      db.select({ applicationsThisWeek: sql<number>`count(*)` }).from(applicationsTable).where(sql`${applicationsTable.createdAt} > ${weekAgo}`),
    ]);

    res.json({
      totalUsers: Number(totalUsers),
      activeUsers: Number(activeUsers),
      totalApplications: Number(totalApplications),
      totalJobs: Number(totalJobs),
      totalResumes: Number(totalResumes),
      totalAtsReports: Number(totalAtsReports),
      newUsersThisWeek: Number(newUsersThisWeek),
      applicationsThisWeek: Number(applicationsThisWeek),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/users
router.get("/users", resolveUser, requireAdmin, async (req, res) => {
  try {
    const search = req.query.search as string | undefined;
    const page = Math.max(1, parseInt((req.query.page as string) ?? "1"));
    const limit = 20;
    const offset = (page - 1) * limit;

    const users = await db.select().from(usersTable)
      .where(search ? ilike(usersTable.email, `%${search}%`) : undefined)
      .orderBy(desc(usersTable.createdAt))
      .offset(offset)
      .limit(limit);

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(usersTable)
      .where(search ? ilike(usersTable.email, `%${search}%`) : undefined);

    const enriched = await Promise.all(users.map(async u => {
      const [{ appCount }] = await db.select({ appCount: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.userId, u.id));
      const [{ resumeCount }] = await db.select({ resumeCount: sql<number>`count(*)` }).from(resumesTable).where(eq(resumesTable.userId, u.id));
      return {
        id: u.id,
        clerkId: u.clerkId,
        email: u.email,
        name: u.name,
        role: u.role,
        applicationCount: Number(appCount),
        resumeCount: Number(resumeCount),
        createdAt: u.createdAt,
      };
    }));

    res.json({ users: enriched, total: Number(count), page });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/users/:id/suspend
router.patch("/users/:id/suspend", resolveUser, requireAdmin, async (req, res) => {
  try {
    const clerkId = req.params["id"] as string;
    await db.update(usersTable).set({ isSuspended: true }).where(eq(usersTable.clerkId, clerkId));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
