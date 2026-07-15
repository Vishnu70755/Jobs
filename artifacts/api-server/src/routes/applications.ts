import { Router } from "express";
import { db, applicationsTable, jobsTable, insertApplicationSchema } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { resolveUser } from "../middlewares/auth";
import { z } from "zod";
import { logger } from "../lib/logger";
import { mailService } from "../lib/mail";
import {
  getApplicationConfirmationEmailTemplate,
  getApplicationStatusUpdateEmailTemplate,
  getInterviewScheduledEmailTemplate,
  getInterviewReminderEmailTemplate,
  getInterviewCancelledEmailTemplate
} from "../lib/email-templates";

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
  declined: "Declined"
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

    // Validate request body using Zod schema
    const validatedData = insertApplicationSchema.parse({
      userId: user.id,
      jobId: req.body.jobId,
      company: req.body.company,
      role: req.body.role,
      status: req.body.status,
      appliedAt: req.body.appliedAt,
      resumeId: req.body.resumeId,
      notes: req.body.notes,
      source: req.body.source,
    });

    const [app] = await db.insert(applicationsTable).values({
      userId: user.id,
      jobId: validatedData.jobId ?? null,
      company: validatedData.company,
      role: validatedData.role,
      status: validatedData.status ?? "saved",
      appliedAt: validatedData.appliedAt ? new Date(validatedData.appliedAt) : null,
      resumeId: validatedData.resumeId ?? null,
      notes: validatedData.notes ?? null,
      source: validatedData.source ?? null,
    }).returning();

    // Send confirmation email when the user actually applies (status "applied")
    if (validatedData.status === "applied") {
      try {
        // Get user email from Clerk (already in user object) or fallback to DB
        const userEmail = user.email; // DB column -- always present
        if (userEmail) {
          // Fetch job details for personalized email
          const jobResult = await db
            .select({
              title: jobsTable.title,
              company: jobsTable.company,
            })
            .from(jobsTable)
            .where(eq(jobsTable.id, Number(validatedData.jobId)))
            .limit(1);

          const job = jobResult[0];
          const jobTitle = job?.title ?? "the position";
          const companyName = job?.company ?? "a company";

          // Use the new email template
          const emailTemplate = getApplicationConfirmationEmailTemplate(
            user.name || "there",
            jobTitle,
            companyName
          );

          try {
            await mailService.sendTemplateEmail(userEmail, emailTemplate);

            logger.info({
              userId: user.id,
              email: userEmail,
              subject: emailTemplate.subject,
              timestamp: new Date().toISOString(),
              event: "application_confirmation_email_sent",
            }, "Application confirmation email sent successfully");
          } catch (emailErr) {
            logger.error({
              userId: user.id,
              email: userEmail,
              subject: emailTemplate.subject,
              err: emailErr instanceof Error
                ? emailErr.message
                : String(emailErr),
              timestamp: new Date().toISOString(),
              event: "application_confirmation_email_failed",
            }, "Failed to send application confirmation e-mail");
          }
        } else {
          // If we don't have email, log warning but don't fail the request
          logger.warn({ userId: user.id }, "Could not determine e‑mail address for application confirmation");
        }
      } catch (err) {
        // Log any error in fetching user email or job details, but don't fail the request
        logger.error({
          userId: user.id,
          err: err instanceof Error
            ? err.message
            : String(err),
          timestamp: new Date().toISOString(),
          event: 'application_confirmation_error'
        }, "Failed to prepare application confirmation email");
      }
    }

    res.status(201).json(app);
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Validation error
      req.log.warn({ error: err.errors }, "Validation failed for application creation");
      return res.status(400).json({ error: "Invalid input", details: err.errors });
    }

    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /applications/:id
router.get("/:id", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const id = parseInt(req.params["id"] as string);
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
    const id = parseInt(req.params["id"] as string);

    // Validate request body using partial Zod schema (all fields optional for updates)
    const updateApplicationSchema = insertApplicationSchema.partial();
    const validatedData = updateApplicationSchema.parse(req.body);

    // Get current application to check for status changes
    const currentApp = await db.query.applicationsTable.findFirst({
      where: (app, { eq, and }) =>
        and(
          eq(app.id, id),
          eq(app.userId, user.id)
        )
    });

    const [updated] = await db.update(applicationsTable)
      .set({
        ...(validatedData.status !== undefined && { status: validatedData.status }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
        ...(validatedData.interviewDate !== undefined && { interviewDate: validatedData.interviewDate ? new Date(validatedData.interviewDate) : null }),
        ...(validatedData.recruiterName !== undefined && { recruiterName: validatedData.recruiterName }),
        ...(validatedData.recruiterEmail !== undefined && { recruiterEmail: validatedData.recruiterEmail }),
        ...(validatedData.salaryOffered !== undefined && { salaryOffered: validatedData.salaryOffered }),
        ...(validatedData.interviewMode !== undefined && { interviewMode: validatedData.interviewMode }),
        ...(validatedData.meetingLink !== undefined && { meetingLink: validatedData.meetingLink }),
        ...(validatedData.appliedAt !== undefined && { appliedAt: validatedData.appliedAt ? new Date(validatedData.appliedAt) : null }),
        ...(validatedData.resumeId !== undefined && { resumeId: validatedData.resumeId }),
        updatedAt: new Date(),
      })
      .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, user.id)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }

    // Send email notifications for specific updates
    const userEmail = user.email; // DB column -- always present
    if (userEmail && currentApp) {
      try {
        // Fetch job details for personalized email
        const jobResult = await db
          .select({
            title: jobsTable.title,
            company: jobsTable.company,
          })
          .from(jobsTable)
          .where(eq(jobsTable.id, Number(currentApp.jobId)))
          .limit(1);

        const job = jobResult[0];
        const jobTitle = job?.title ?? "the position";
        const companyName = job?.company ?? "a company";
        const applicationDate = currentApp.appliedAt
          ? new Date(currentApp.appliedAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric'
            })
          : 'Unknown';

        // Handle status change notifications
        if (validatedData.status !== undefined && validatedData.status !== currentApp.status) {
          const oldStatus = currentApp.status;
          const newStatus = validatedData.status;

          // Send status update email
          const statusEmailTemplate = getApplicationStatusUpdateEmailTemplate(
            user.name || "there",
            jobTitle,
            companyName,
            oldStatus,
            newStatus,
            applicationDate
          );

          await mailService.sendTemplateEmail(userEmail, statusEmailTemplate);
          logger.info({
            userId: user.id,
            email: userEmail,
            subject: statusEmailTemplate.subject,
            timestamp: new Date().toISOString(),
            event: 'application_status_update_email_sent'
          }, "Application status update email sent successfully");
        }

        // Handle interview scheduling notifications
        if (validatedData.interviewDate !== undefined && validatedData.interviewDate !== null) {
          // Format the interview date and time
          const interviewDateObj = new Date(validatedData.interviewDate);
          const formattedDate = interviewDateObj.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
          });
          const formattedTime = interviewDateObj.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
          });

          // Send interview scheduled email
          const interviewEmailTemplate = getInterviewScheduledEmailTemplate(
            user.name || "there",
            jobTitle,
            companyName,
            formattedDate,
            formattedTime,
            validatedData.interviewMode || "unspecified",
            validatedData.meetingLink || "TBD"
          );

          await mailService.sendTemplateEmail(userEmail, interviewEmailTemplate);
          logger.info({
            userId: user.id,
            email: userEmail,
            subject: interviewEmailTemplate.subject,
            timestamp: new Date().toISOString(),
            event: 'interview_scheduled_email_sent'
          }, "Interview scheduled email sent successfully");

          // Also send interview reminder (for demo purposes, in reality this would be scheduled)
          const reminderEmailTemplate = getInterviewReminderEmailTemplate(
            user.name || "there",
            jobTitle,
            companyName,
            formattedDate,
            formattedTime
          );

          await mailService.sendTemplateEmail(userEmail, reminderEmailTemplate);
          logger.info({
            userId: user.id,
            email: userEmail,
            subject: reminderEmailTemplate.subject,
            timestamp: new Date().toISOString(),
            event: 'interview_reminder_email_sent'
          }, "Interview reminder email sent successfully");
        }

        // Handle interview cancellation (if status changed to something other than interview_scheduled)
        if (validatedData.status !== undefined &&
            validatedData.status !== "interview_scheduled" &&
            currentApp.status === "interview_scheduled") {

          const interviewCancelledEmailTemplate = getInterviewCancelledEmailTemplate(
            user.name || "there",
            jobTitle,
            companyName
          );

          await mailService.sendTemplateEmail(userEmail, interviewCancelledEmailTemplate);
          logger.info({
            userId: user.id,
            email: userEmail,
            subject: interviewCancelledEmailTemplate.subject,
            timestamp: new Date().toISOString(),
            event: 'interview_cancelled_email_sent'
          }, "Interview cancelled email sent successfully");
        }

      } catch (emailErr) {
        logger.error({
          userId: user.id,
          email: userEmail,
          err: emailErr instanceof Error
            ? emailErr.message
            : String(emailErr),
          timestamp: new Date().toISOString(),
          event: "application_update_email_failed"
        }, "Failed to send application update e-mail");
      }
    }

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Validation error
      req.log.warn({ error: err.errors }, "Validation failed for application update");
      return res.status(400).json({ error: "Invalid input", details: err.errors });
    }

    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /applications/:id
router.delete("/:id", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const id = parseInt(req.params["id"] as string);
    await db.delete(applicationsTable).where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, user.id)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;