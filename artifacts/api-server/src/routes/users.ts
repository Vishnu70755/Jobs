import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { resumesTable } from "@workspace/db";
import { savedJobsTable } from "@workspace/db";
import { applicationsTable } from "@workspace/db";
import { eq, gt, desc, and, count } from "drizzle-orm";
import { resolveUser } from "../middlewares/auth";
import { mailService } from "../lib/mail";
import {
  getWelcomeEmailTemplate,
  getLoginEmailTemplate
} from "../lib/email-templates";
import { clerkClient } from "@clerk/express";
import crypto from "crypto";
import { logger } from "../lib/logger";

const router = Router();

// GET /users/me
router.get("/me", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;

    // Fetch Clerk profile for avatar URL
    const clerkUser = await clerkClient.users.getUser(user.clerkId);
    const avatarUrl = clerkUser?.profileImageUrl ?? null;

    // Fetch the user's resume (prefer default, otherwise most recent)
    const resume = await db.query.resumesTable.findFirst({
      where: (resumesTable, { eq }) => eq(resumesTable.userId, user.id),
      orderBy: (resumesTable, { desc }) => [desc(resumesTable.isDefault), desc(resumesTable.updatedAt)],
    });
    const resumeUrl = resume?.fileUrl ?? null;
    const resumeFileName = resume?.fileName ?? null;

    // Count saved jobs
    const [savedJobsCountResult] = await db
      .select({ count: count() })
      .from(savedJobsTable)
      .where(eq(savedJobsTable.userId, user.id));
    const savedJobsCount = Number(savedJobsCountResult.count) || 0;

    // Count tracked applications (where isTracked = true)
    const [trackedJobsCountResult] = await db
      .select({ count: count() })
      .from(applicationsTable)
      .where(
        and(
          eq(applicationsTable.userId, user.id),
          eq(applicationsTable.isTracked, true)
        )
      );
    const trackedJobsCount = Number(trackedJobsCountResult.count) || 0;

    res.json({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      title: user.title,
      location: user.location,
      phone: user.phone ?? null,
      bio: user.bio ?? null,
      dateOfBirth: user.dateOfBirth ?? null,
      gender: user.gender ?? null,
      portfolio: user.portfolio ?? null,
      skills: user.skills ?? [],
      experience: user.experience,
      targetRole: user.targetRole,
      linkedinUrl: user.linkedinUrl,
      githubUrl: user.githubUrl,
      // New fields
      avatarUrl,
      resumeUrl,
      resumeFileName,
      savedJobsCount,
      trackedJobsCount,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /users/me
router.patch("/me", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const {
      name, title, location, skills, experience, targetRole, linkedinUrl, githubUrl,
      phone, bio, dateOfBirth, gender, portfolio,
    } = req.body;

    const [updated] = await db.update(usersTable)
      .set({
        ...(name !== undefined && { name }),
        ...(title !== undefined && { title }),
        ...(location !== undefined && { location }),
        ...(skills !== undefined && { skills }),
        ...(experience !== undefined && { experience }),
        ...(targetRole !== undefined && { targetRole }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(githubUrl !== undefined && { githubUrl }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio }),
        ...(dateOfBirth !== undefined && { dateOfBirth }),
        ...(gender !== undefined && { gender }),
        ...(portfolio !== undefined && { portfolio }),
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /users/request-verification
router.post("/request-verification", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with verification token
    const [updatedUser] = await db.update(usersTable)
      .set({
        emailVerificationToken: verificationToken,
        emailVerificationExpires: expires,
      })
      .where(eq(usersTable.id, user.id))
      .returning();

    // Send verification email using template
    const verificationUrl = `${process.env.BASE_URL || "http://localhost:3000"}/verify-email/${verificationToken}`;
    try {
      const emailTemplate = getWelcomeEmailTemplate(
        user.name || "there",
        verificationUrl
      );
      await mailService.sendTemplateEmail(user.email, emailTemplate);

      // Log success with timestamp
      req.log.info({
        to: user.email,
        subject: emailTemplate.subject,
        timestamp: new Date().toISOString(),
        event: 'email_verification_sent'
      }, "Verification email sent successfully");
    } catch (emailError) {
      // Log email error but don't fail the request
      req.log.error({
        error: emailError.message,
        to: user.email,
        subject: "Verify your email address",
        timestamp: new Date().toISOString(),
        event: 'email_verification_failed'
      }, "Failed to send verification email");
    }

    res.json({ message: "Verification email sent" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /users/verify-email/:token
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with valid verification token
    const user = await db.query.usersTable.findFirst({
      where: (users, { eq, and, gt }) =>
        and(
          eq(users.emailVerificationToken, token),
          gt(users.emailVerificationExpires, new Date()),
        ),
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    // Mark email as verified and clear token
    await db.update(usersTable)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id));

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /users/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email
    const user = await db.query.usersTable.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: "If the email exists, a reset link has been sent" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await db.update(usersTable)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: expires,
      })
      .where(eq(usersTable.id, user.id));

    // Send reset email
    const resetUrl = `${process.env.BASE_URL || "http://localhost:3000"}/reset-password/${resetToken}`;
    try {
      const emailTemplate = getPasswordResetEmailTemplate(
        user.name || "there",
        resetUrl
      );
      await mailService.sendTemplateEmail(user.email, emailTemplate);
      // Log success with timestamp
      req.log.info({
        to: user.email,
        subject: emailTemplate.subject,
        timestamp: new Date().toISOString(),
        event: 'email_password_reset_sent'
      }, "Reset email sent successfully");
    } catch (emailError) {
      // Log email error but don't fail the request
      req.log.error({
        error: emailError.message,
        to: user.email,
        subject: "Reset your password",
        timestamp: new Date().toISOString(),
        event: 'email_password_reset_failed'
      }, "Failed to send reset email");
    }

    res.json({ message: "If the email exists, a reset link has been sent" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /users/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    // Find user with valid reset token
    const user = await db.query.usersTable.findFirst({
      where: (users, { eq, and, gt }) =>
        and(
          eq(users.passwordResetToken, token),
          gt(users.passwordResetExpires, new Date()),
        ),
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Update password via Clerk
    await clerkClient.users.updateUser(user.clerkId, {
      password: password,
    });

    // Clear reset token
    await db.update(usersTable)
      .set({
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id));

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /users/change-password
router.post("/change-password", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old password and new password are required" });
    }

    // Update password via Clerk
    await clerkClient.users.updateUser(user.clerkId, {
      password: newPassword,
    });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Track user logins for security notifications
// This would typically be called from your authentication middleware
// For now, we'll add a placeholder endpoint that could be called after login
router.post("/login-notification", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const { ipAddress, location, userAgent } = req.body;

    // Send login notification email
    try {
      const loginTime = new Date().toLocaleString();
      const emailTemplate = getLoginEmailTemplate(
        user.name || "there",
        loginTime,
        ipAddress || "Unknown",
        location || "Unknown"
      );
      await mailService.sendTemplateEmail(user.email, emailTemplate);

      res.json({ message: "Login notification sent" });
    } catch (emailError) {
      req.log.error({
        error: emailError.message,
        to: user.email,
        subject: "Login notification",
        timestamp: new Date().toISOString(),
        event: 'email_login_notification_failed'
      }, "Failed to send login notification email");
      res.status(500).json({ error: "Failed to send login notification" });
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;