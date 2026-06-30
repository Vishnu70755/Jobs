import cron from "node-cron";
import { db, applicationsTable, notificationsTable, savedJobsTable, jobsTable } from "@workspace/db";
import { and, eq, gt, lt, isNotNull, notInArray, sql } from "drizzle-orm";
import { logger } from "./lib/logger";
import { importServiceManager } from "./services/import";

const REMINDER_HOURS = [48, 42, 36, 30, 24, 18, 12, 6];

function formatIST(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

async function checkInterviewReminders(): Promise<void> {
  try {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const upcoming = await db
      .select({
        id: applicationsTable.id,
        userId: applicationsTable.userId,
        company: applicationsTable.company,
        role: applicationsTable.role,
        interviewDate: applicationsTable.interviewDate,
        interviewMode: applicationsTable.interviewMode,
        meetingLink: applicationsTable.meetingLink,
        notes: applicationsTable.notes,
      })
      .from(applicationsTable)
      .where(
        and(
          isNotNull(applicationsTable.interviewDate),
          gt(applicationsTable.interviewDate, now),
          lt(applicationsTable.interviewDate, in48h),
        ),
      );

    if (upcoming.length === 0) return;

    logger.info({ count: upcoming.length }, "Checking interview reminders");

    for (const app of upcoming) {
      if (!app.interviewDate) continue;

      const msLeft = app.interviewDate.getTime() - now.getTime();
      const hoursLeft = msLeft / (60 * 60 * 1000);

      for (const h of REMINDER_HOURS) {
        if (hoursLeft > h || hoursLeft <= h - 7) continue;

        const reminderType = `interview_reminder_${h}h`;

        const [existing] = await db
          .select({ id: notificationsTable.id })
          .from(notificationsTable)
          .where(
            and(
              eq(notificationsTable.userId, app.userId),
              eq(notificationsTable.applicationId, app.id),
              eq(notificationsTable.type, reminderType),
            ),
          )
          .limit(1);

        if (existing) continue;

        const istFormatted = formatIST(app.interviewDate);
        const modeLabel = app.interviewMode === "online"
          ? "Online/Video"
          : app.interviewMode === "telephonic"
            ? "Telephonic"
            : app.interviewMode === "in_person"
              ? "In-Person"
              : "Interview";

        const linkNote = app.meetingLink
          ? ` Meeting link: ${app.meetingLink}.`
          : "";

        await db.insert(notificationsTable).values({
          userId: app.userId,
          applicationId: app.id,
          type: reminderType,
          title: `Interview Reminder: ${app.company} in ${h} Hours`,
          message: `Your ${modeLabel} with ${app.company} for ${app.role} is scheduled in ${h} hours — ${istFormatted} IST.${linkNote} You've got this! 🍀`,
        });

        logger.info(
          { appId: app.id, company: app.company, hours: h },
          "Interview reminder notification created",
        );
      }
    }
  } catch (err) {
    logger.error(err, "Interview reminder scheduler error");
  }
}

async function cleanupOldJobs(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

    const savedIds = db.select({ id: savedJobsTable.jobId }).from(savedJobsTable);
    const appliedIds = db.select({ id: applicationsTable.jobId }).from(applicationsTable);
    await db.delete(jobsTable).where(
      and(
        lt(jobsTable.createdAt, cutoff),
        notInArray(jobsTable.id, savedIds),
        notInArray(jobsTable.id, appliedIds),
      )
    );

    logger.info({ cutoff: cutoff.toISOString() }, "Old jobs cleanup completed");
  } catch (err) {
    logger.error(err, "Failed to cleanup old jobs");
    throw err;
  }
}

export function startScheduler(): void {
  // Initialize import service manager (create default configs if needed)
  importServiceManager.initializeDefaultConfigs().catch(err => {
    logger.error(err, "Failed to initialize import service configurations");
  });

  cron.schedule("0 * * * *", () => {
    checkInterviewReminders().catch((err) =>
      logger.error(err, "Reminder job failed"),
    );
  });

  checkInterviewReminders().catch((err) =>
    logger.error(err, "Startup reminder check failed"),
  );

  // Start import scheduler
  importServiceManager.startScheduler().catch(err => {
    logger.error(err, "Failed to start import scheduler");
  });

  // Schedule daily cleanup of old jobs (2:00 AM server time)
  cron.schedule("0 2 * * *", () => {
    cleanupOldJobs().catch((err) =>
      logger.error(err, "Failed to cleanup old jobs"),
    );
  });

  logger.info("Interview reminder scheduler started (runs every hour)");
  logger.info("Import scheduler started");
  logger.info("Old jobs cleanup scheduler started (runs daily at 2:00 AM)");
}

// Note: The actual startScheduler function is defined above (lines 107-150)
// This duplicate has been removed to avoid overwriting the proper implementation