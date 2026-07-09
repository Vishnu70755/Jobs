import { Router } from "express";
import { clerkClient } from "@clerk/express";
import { db, usersTable, applicationsTable, jobsTable, resumesTable, atsReportsTable, importJobsTable, importSourceConfigsTable, savedJobsTable, emailLogsTable } from "@workspace/db";
import { eq, ilike, desc, sql, and, lt, gt, gte, lte } from "drizzle-orm";
import { resolveUser, requireAdmin } from "../middlewares/auth";
import importRoutes from "./admin/import";
import sourceRoutes from "./admin/source"; // <-- added

const router = Router();

// Import routes
router.use("/import", importRoutes);
// Sources routes
router.use("/sources", sourceRoutes); // <-- added

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
      // Fetch Clerk profile for avatar — wrapped in try/catch so a single
      // failure (rate limit, stale clerkId, network hiccup) doesn't take
      // down the entire user list request.
      let avatarUrl: string | null = null;
      try {
        const clerkUser = await clerkClient.users.getUser(u.clerkId);
        avatarUrl = clerkUser?.profileImageUrl ?? null;
      } catch (clerkErr) {
        req.log.warn({ userId: u.id, err: clerkErr }, "Failed to fetch Clerk profile for user");
      }

      // Fetch latest resume (prefer default, then most recent)
      const resume = await db.query.resumesTable.findFirst({
        where: (resumesTable, { eq }) => eq(resumesTable.userId, u.id),
        orderBy: (resumesTable, { desc }) => [desc(resumesTable.isDefault), desc(resumesTable.updatedAt)],
      });
      const resumeUrl = resume?.fileUrl ?? null;
      const resumeFileName = resume?.fileName ?? null;

      // Counts
      const [
        { appCount },
        { resumeCount: resumeCountResult },
        { savedJobsCount },
        { atsReportsCount }
      ] = await Promise.all([
        db.select({ appCount: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.userId, u.id)),
        db.select({ resumeCount: sql<number>`count(*)` }).from(resumesTable).where(eq(resumesTable.userId, u.id)),
        db.select({ savedJobsCount: sql<number>`count(*)` }).from(savedJobsTable).where(eq(savedJobsTable.userId, u.id)),
        db.select({ atsReportsCount: sql<number>`count(*)` }).from(atsReportsTable).where(eq(atsReportsTable.userId, u.id)),
      ]);

      return {
        id: u.id,
        clerkId: u.clerkId,
        email: u.email,
        name: u.name,
        role: u.role,
        // Existing fields (maybe keep for compatibility)
        applicationCount: Number(appCount),
        resumeCount: Number(resumeCountResult),
        // New fields
        avatarUrl,
        resumeUrl,
        resumeFileName,
        savedJobsCount: Number(savedJobsCount),
        // Renamed to match frontend's expected field name (was atsReportsCount)
        atsReportCount: Number(atsReportsCount),
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

// Email Logs Routes
// GET /admin/email-logs
router.get("/email-logs", resolveUser, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) ?? "1"));
    const limit = Math.min(100, parseInt((req.query.limit as string) ?? "50"));
    const offset = (page - 1) * limit;
    const search = (req.query.search as string) ?? "";
    const statusFilter = (req.query.status as string) ?? "";
    const eventFilter = (req.query.event as string) ?? "";

    let whereClause = undefined;

    if (search) {
      whereClause = ilike(emailLogsTable.recipient, `%${search}%`);
    }

    if (statusFilter) {
      whereClause = whereClause ? and(whereClause, eq(emailLogsTable.status, statusFilter)) : eq(emailLogsTable.status, statusFilter);
    }

    if (eventFilter) {
      whereClause = whereClause ? and(whereClause, eq(emailLogsTable.event, eventFilter)) : eq(emailLogsTable.event, eventFilter);
    }

    const [emailLogs, { count }] = await Promise.all([
      db.select().from(emailLogsTable)
        .where(whereClause)
        .orderBy(desc(emailLogsTable.createdAt))
        .offset(offset)
        .limit(limit),
      db.select({ count: sql<number>`count(*)` }).from(emailLogsTable).where(whereClause)
    ]);

    res.json({ emailLogs, total: Number(count), page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/email-logs/:id/retry
router.post("/email-logs/:id/retry", resolveUser, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const emailLog = await db.query.emailLogsTable.findFirst({
      where: eq(emailLogsTable.id, id)
    });

    if (!emailLog) {
      res.status(404).json({ error: "Email log not found" });
      return;
    }

    // Retry sending the email
    const { success, error } = await retryEmail(emailLog);

    if (success) {
      // Update the log as successful
      await db.update(emailLogsTable)
        .set({
          status: 'sent',
          error: null,
          retryCount: emailLog.retryCount + 1,
          lastAttemptedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(emailLogsTable.id, id));

      res.json({ success: true, message: 'Email resent successfully' });
    } else {
      // Update the log with the error
      await db.update(emailLogsTable)
        .set({
          status: 'failed',
          error: error,
          retryCount: emailLog.retryCount + 1,
          lastAttemptedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(emailLogsTable.id, id));

      res.status(500).json({ error: `Failed to resend email: ${error}` });
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to retry sending an email
async function retryEmail(emailLog: typeof emailLogsTable.$inferSelect): Promise<{ success: boolean; error?: string }> {
  try {
    // Import the mail service and email templates
    const { mailService } = await import("../lib/mail");
    const {
      getWelcomeEmailTemplate,
      getLoginEmailTemplate,
      getResumeUploadEmailTemplate,
      getResumeUpdateEmailTemplate,
      getApplicationStatusUpdateEmailTemplate,
      getInterviewScheduledEmailTemplate,
      getInterviewReminderEmailTemplate,
      getInterviewCancelledEmailTemplate,
      getApplicationConfirmationEmailTemplate,
      getATSAnalysisEmailTemplate,
      getPasswordResetEmailTemplate,
      getAdminNewUserEmailTemplate,
      getAdminLoginEmailTemplate,
      getAdminUserLoginEmailTemplate,
      getImportStartedEmailTemplate,
      getImportCompletedEmailTemplate,
      getImportFailedEmailTemplate,
      getSourceAddedEmailTemplate,
      getSourceUpdatedEmailTemplate,
      getSourceDisabledEmailTemplate,
      getSourceEnabledEmailTemplate,
      getSourceDeletedEmailTemplate,
      getDailySummaryEmailTemplate,
      getSystemErrorEmailTemplate
    } = await import("../lib/email-templates");

    // Map event to template function
    const templateMap: Record<string, (data: any) => { subject: string; html: string; text: string }> = {
      'user_registration': getWelcomeEmailTemplate,
      'user_login': getLoginEmailTemplate,
      'resume_upload': getResumeUploadEmailTemplate,
      'resume_update': getResumeUpdateEmailTemplate,
      'application_status_update': getApplicationStatusUpdateEmailTemplate,
      'interview_scheduled': getInterviewScheduledEmailTemplate,
      'interview_reminder': getInterviewReminderEmailTemplate,
      'interview_cancelled': getInterviewCancelledEmailTemplate,
      'application_confirmation': getApplicationConfirmationEmailTemplate,
      'ats_analysis': getATSAnalysisEmailTemplate,
      'password_reset': getPasswordResetEmailTemplate,
      'admin_new_user': getAdminNewUserEmailTemplate,
      'admin_login': getAdminLoginEmailTemplate,
      'admin_user_login': getAdminUserLoginEmailTemplate,
      'import_started': getImportStartedEmailTemplate,
      'import_completed': getImportCompletedEmailTemplate,
      'import_failed': getImportFailedEmailTemplate,
      'source_added': getSourceAddedEmailTemplate,
      'source_updated': getSourceUpdatedEmailTemplate,
      'source_disabled': getSourceDisabledEmailTemplate,
      'source_enabled': getSourceEnabledEmailTemplate,
      'source_deleted': getSourceDeletedEmailTemplate,
      'daily_summary': getDailySummaryEmailTemplate,
      'system_error': getSystemErrorEmailTemplate,
    };

    const templateFunction = templateMap[emailLog.event];
    if (!templateFunction) {
      throw new Error(`Unknown email event: ${emailLog.event}`);
    }

    // Parse the recipient data (assuming it's stored as JSON string)
    let recipientData: any = {};
    try {
      recipientData = JSON.parse(emailLog.recipientData || '{}');
    } catch (e) {
      // If parsing fails, use empty object
      recipientData = {};
    }

    // Generate the email template
    const template = templateFunction(recipientData);

    // Send the email
    await mailService.sendTemplateEmail(emailLog.recipient, template);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export default router;