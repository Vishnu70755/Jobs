import { Router, Request, Response, NextFunction } from "express";
import { mailService } from "../lib/mail";
import { logger } from "../lib/logger";

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
      return res.status(20).json({ received: true });
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
      const adminSubject = "User Logged Into Vishnu's Job Quest";

      const adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #2c3e50;">User Login Notification</h2>
          <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>User ID:</strong> ${escapeHtml(userId ?? "N/A")}</p>
          <p><strong>Login Time:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
          <p><strong>IP Address:</strong> ${escapeHtml(ip)}</p>
          <p><strong>Browser / User-Agent:</strong> ${escapeHtml(userAgent)}</p>
          <p><strong>Login Type:</strong> ${loginType}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.9em; color: #7f8c8d;">This is an automated message from Vishnu's Job Quest.</p>
        </div>
      `;

      const adminText = `
User Login Notification

Name: ${fullName}
Email: ${email}
User ID: ${userId ?? "N/A"}
Login Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
IP Address: ${ip}
Browser / User-Agent: ${userAgent}
Login Type: ${loginType}

This is an automated message from Vishnu's Job Quest.
      `;

      await mailService.sendHtmlMail(adminEmail, adminSubject, adminHtml);
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
      const userSubject = "Welcome to Vishnu's Job Quest";

      const userHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; margin: 0;">Vishnu's Job Quest</h1>
            <p style="color: #7f8c8d; margin: 5px 0 0;">Find Jobs</p>
          </div>
          <h2 style="color: #2c3e50;">Hello ${escapeHtml(firstName || "there")},</h2>
          <p>Thank you for logging into <strong>Vishnu's Job Quest</strong>.</p>
          <p>Our platform helps you <strong>Find Jobs</strong> that match your skills and aspirations.</p>
          <p>To get the most out of your experience, we encourage you to:</p>
          <ul style="padding-left: 20px;">
            <li>Complete your profile with your skills, experience, and preferences.</li>
            <li>Upload your resume so employers can find you easily.</li>
            <li>Search for jobs using our powerful search and filters.</li>
            <li>Track your applications and stay organized.</li>
            <li>Use our ATS Resume Analysis tool to optimize your resume for applicant tracking systems.</li>
          </ul>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.9em; color: #7f8c8d; text-align: center;">
            Thank you for being part of Vishnu's Job Quest!<br/>
            <a href="${process.env.BASE_URL || "http://localhost:3000"}" style="color: #3498db; text-decoration: none;">Visit Your Dashboard</a>
          </p>
        </div>
      `;

      const userText = `
Welcome to Vishnu's Job Quest

Hello ${firstName || "there"},

Thank you for logging into Vishnu's Job Quest.

Our platform helps you Find Jobs that match your skills and aspirations.

To get the most out of your experience, we encourage you to:
- Complete your profile with your skills, experience, and preferences.
- Upload your resume so employers can find you easily.
- Search for jobs using our powerful search and filters.
- Track your applications and stay organized.
- Use our ATS Resume Analysis tool to optimize your resume for applicant tracking systems.

If you have any questions, feel free to reach out to our support team.

Thank you for being part of Vishnu's Job Quest!
Visit Your Dashboard: ${process.env.BASE_URL || "http://localhost:3000"}
      `; 

      await mailService.sendHtmlMail(email, userSubject, userHtml);
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