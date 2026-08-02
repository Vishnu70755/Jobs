import { Router } from "express";
import { clerkClient } from "@clerk/express";
import { db, usersTable, applicationsTable, jobsTable, resumesTable, atsReportsTable, importJobsTable, importSourceConfigsTable, savedJobsTable } from "@workspace/db";
import { eq, ilike, desc, sql, and, inArray } from "drizzle-orm";
import { resolveUser, requireAdmin } from "../middlewares/auth";
import importRoutes from "./admin/import";
import importSourcesRoutes from "./admin/import-sources";

const router = Router();

// Import routes
router.use("/import", importRoutes);
router.use("/import-sources", importSourcesRoutes);

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
      totalUsers: Number(totalUsers) || 0,
      activeUsers: Number(activeUsers) || 0,
      totalApplications: Number(totalApplications) || 0,
      totalJobs: Number(totalJobs) || 0,
      totalResumes: Number(totalResumes) || 0,
      totalAtsReports: Number(totalAtsReports) || 0,
      newUsersThisWeek: Number(newUsersThisWeek) || 0,
      applicationsThisWeek: Number(applicationsThisWeek) || 0,
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

    // First, get users with pagination
    const users = await db.select().from(usersTable)
      .where(search ? ilike(usersTable.email, `%${search}%`) : undefined)
      .orderBy(desc(usersTable.createdAt))
      .offset(offset)
      .limit(limit);

    // Get total count for pagination
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(usersTable)
      .where(search ? ilike(usersTable.email, `%${search}%`) : undefined);

    // Extract user IDs for batch queries
    const userIds = users.map(u => u.id);

    // Batch fetch all counts in parallel to avoid N+1 query problem
    const [
      appCounts,
      resumeCounts,
      savedJobsCounts,
      trackedJobsCounts,
      atsReportsCounts
    ] = await Promise.all([
      // Applications count per user
      db.select({ userId: applicationsTable.userId, appCount: sql<number>`count(*)` })
        .from(applicationsTable)
        .where(inArray(applicationsTable.userId, userIds))
        .groupBy(applicationsTable.userId),

      // Resumes count per user
      db.select({ userId: resumesTable.userId, resumeCount: sql<number>`count(*)` })
        .from(resumesTable)
        .where(inArray(resumesTable.userId, userIds))
        .groupBy(resumesTable.userId),

      // Saved jobs count per user
      db.select({ userId: savedJobsTable.userId, savedJobsCount: sql<number>`count(*)` })
        .from(savedJobsTable)
        .where(inArray(savedJobsTable.userId, userIds))
        .groupBy(savedJobsTable.userId),

      // Tracked jobs count per user
      db.select({
        userId: applicationsTable.userId,
        trackedJobsCount: sql<number>`count(*)`
      })
        .from(applicationsTable)
        .where(and(
          inArray(applicationsTable.userId, userIds),
          eq(applicationsTable.isTracked, true)
        ))
        .groupBy(applicationsTable.userId),

      // ATS reports count per user
      db.select({
        userId: atsReportsTable.userId,
        atsReportsCount: sql<number>`count(*)`
      })
        .from(atsReportsTable)
        .where(inArray(atsReportsTable.userId, userIds))
        .groupBy(atsReportsTable.userId)
    ]);

    // Convert arrays to maps for easy lookup
    const appCountsMap = new Map(appCounts.map(item => [item.userId, Number(item.appCount) || 0]));
    const resumeCountsMap = new Map(resumeCounts.map(item => [item.userId, Number(item.resumeCount) || 0]));
    const savedJobsCountsMap = new Map(savedJobsCounts.map(item => [item.userId, Number(item.savedJobsCount) || 0]));
    const trackedJobsCountsMap = new Map(trackedJobsCounts.map(item => [item.userId, Number(item.trackedJobsCount) || 0]));
    const atsReportsCountsMap = new Map(atsReportsCounts.map(item => [item.userId, Number(item.atsReportsCount) || 0]));

    const enriched = await Promise.all(users.map(async u => {
      // Helper to generate avatar URL from initials
      const getAvatarUrlFromInitials = (name: string, email: string | null) => {
        const displayName = name || email?.split('@')[0] || 'User';
        const initials = displayName
          .split(' ')
          .map(part => part[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || '??';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`;
      };

      // Fetch Clerk profile for avatar with fallback
      let avatarUrl = null;
      try {
        const clerkUser = await clerkClient.users.getUser(u.clerkId);
        avatarUrl = (clerkUser as any).profileImageUrl ?? null;
      } catch (err) {
        const clerkError = err as Error;
        req.log.warn({ clerkId: u.clerkId, err: clerkError.message }, "Failed to fetch Clerk user for admin endpoint");
      }
      if (!avatarUrl) {
        // Fallback to generated avatar using name or email
        avatarUrl = getAvatarUrlFromInitials(u.name ?? "", u.email ?? null);
      }

      // Fetch latest resume (prefer default, then most recent)
      const resume = await db.query.resumesTable.findFirst({
        where: (resumesTable, { eq }) => eq(resumesTable.userId, u.id),
        orderBy: (resumesTable, { desc }) => [desc(resumesTable.isDefault), desc(resumesTable.updatedAt)],
      });
      const resumeUrl = resume?.fileUrl ?? null;
      const resumeFileName = resume?.fileName ?? null;

      // Get counts from maps (O(1) lookup instead of individual queries)
      const appCount = appCountsMap.get(u.id) || 0;
      const resumeCountResult = resumeCountsMap.get(u.id) || 0;
      const savedJobsCount = savedJobsCountsMap.get(u.id) || 0;
      const trackedCount = trackedJobsCountsMap.get(u.id) || 0;
      const atsReportsCount = atsReportsCountsMap.get(u.id) || 0;

      const profileFields = [
        'name', 'title', 'location', 'phone', 'bio', 'dateOfBirth',
        'gender', 'portfolio', 'skills', 'experience', 'targetRole',
        'linkedinUrl', 'githubUrl'
      ];
      const filledFields = profileFields.filter(field => {
        const value = (u as any)[field];
        // For arrays, check if length > 0
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        // For strings, check if not null, undefined, or empty
        return value !== null && value !== undefined && value !== '';
      });
      const profileCompletionPercent = Math.round((filledFields.length / profileFields.length) * 100);

      const isSuspended = u.isSuspended ?? false;
      return {
        id: u.id,
        clerkId: u.clerkId,
        email: u.email,
        name: u.name ?? null,
        role: u.role,
        // Avatar with fallback chain: DB (nonexistent) → Clerk → generated
        avatarUrl,
        // Resume
        resumeUrl,
        resumeFileName,
        resumeUploaded: !!resumeUrl, // boolean
        // Dates
        joinedDate: u.createdAt?.toISOString() ?? null,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        // Status
        status: isSuspended ? "suspended" : "active",
        suspended: isSuspended,
        emailVerified: u.emailVerified ?? false,
        // Counts
        applicationCount: appCount,
        resumeCount: Number(resumeCountResult) || 0,
        savedJobsCount: Number(savedJobsCount) || 0,
        trackedJobsCount: Number(trackedCount) || 0,
        // Additional stats (keep for compatibility)
        atsReportsCount: Number(atsReportsCount) || 0,
        // Profile completion
        profileCompletionPercent,
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
