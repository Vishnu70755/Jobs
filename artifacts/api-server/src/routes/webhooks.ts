import { Router, Request, Response, NextFunction } from "express";
import { mailService } from "../lib/mail";
import { logger } from "../lib/logger";
import { getAdminLoginEmailTemplate, getWelcomeEmailTemplate } from "../lib/email-templates";

const router = Router();

/**
 * Clerk webhook endpoint.
 * Expects Clerk to send JSON payload with event type.
 * We handle 'session.created' to send admin login notification and user welcome email.
 */
router.post("/clerk", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, data } = req.body;

    // We only care about session creation events
    if (type !== "session.created") {
      // Acknowledge other events
      return res.status(200).json({ received: true });
    }

    const session = data; // Clerk session object
    // Extract user info from session
    const userId = session?.user_id;
    const email = session?.email_addresses?.[0]?.email_address ?? "";
    const firstName = session?.first_name ?? "";
    const lastName = session?.last_name ?? "";
    const fullName = `${firstName} ${lastName}`.trim() || "Unknown User";

    // Additional request info
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "";
    const userAgent = req.get("user-agent") ?? "";

    // Determine if new or returning user based on session creation time vs user creation time?
    // For simplicity, treat as new if user created within last 5 minutes (using session.created_at)
    const now = Date.now();
    const sessionCreatedAt = session?.created_at ? new Date(session.created_at).getTime() : now;
    const isNewUser = (now - sessionCreatedAt) < 5 * 60 * 1000; // 5 minutes
    const loginType = isNewUser ? "New User" : "Returning User";

    // Prepare admin email
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      logger.warn("ADMIN_EMAIL not set; skipping admin login notification");
    } else {
      const adminTemplate = getAdminLoginEmailTemplate(
        fullName,
        new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        email,
        userId ?? "N/A",
        ip,
        userAgent,
        loginType
      );
await mailService.sendTemplateEmail(adminEmail, adminTemplate, "admin_new_user_registered");
      logger.info({
        userId,
        email,
        ip,
        userAgent,
        loginType,
        timestamp: new Date().toISOString(),
        event: 'admin_login_notification_sent',
        success: true
      }, "Admin login notification sent");
    }

    // Send welcome email to the user (if we have an email)
    if (email) {
      const userTemplate = getWelcomeEmailTemplate(
        firstName || "there",
        `${process.env.BASE_URL || "http://localhost:3000"}`
      );
await mailService.sendTemplateEmail(email, userTemplate, "user_registration");
      logger.info({
        email,
        userId,
        timestamp: new Date().toISOString(),
        event: 'welcome_email_sent',
        success: true
      }, "Welcome email sent to user");
    }

    return res.status(200).json({ sent: true });
  } catch (err) {
    logger.error({
      err: err.message,
      timestamp: new Date().toISOString(),
      event: 'webhook_processing_error'
    }, "Error processing clerk webhook");
    // Still respond 200 to avoid retries
    return res.status(200).json({ error: "Internal error" });
  }
});

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default router;