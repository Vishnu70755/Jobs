import { type Request, type Response, type NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { mailService } from "../lib/mail";
import { getLoginEmailTemplate, getAdminNewUserEmailTemplate, getAdminUserLoginEmailTemplate } from "../lib/email-templates";

export async function requireAuth(req: Request, res: Response, next: Function) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// Returns true if the given email matches the ADMIN_EMAIL env var (case-insensitive).
function isConfiguredAdminEmail(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  return !!adminEmail && !!email && adminEmail.toLowerCase() === email.toLowerCase();
}

export async function getOrCreateUser(clerkId: string, email: string, name?: string): Promise<{ user: typeof usersTable.$inferSelect; isNew: boolean }> {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (existing.length > 0) {
    // If this account's email matches ADMIN_EMAIL but the row isn't marked
    // admin yet (e.g. row predates ADMIN_EMAIL being set), promote it here
    // so no manual DB update is ever needed.
    if (existing[0].role !== "admin" && isConfiguredAdminEmail(existing[0].email)) {
      const [promoted] = await db
        .update(usersTable)
        .set({ role: "admin" })
        .where(eq(usersTable.id, existing[0].id))
        .returning();
      return { user: promoted, isNew: false };
    }
    return { user: existing[0], isNew: false };
  }

  const [created] = await db.insert(usersTable).values({
    clerkId,
    email,
    name: name ?? null,
    skills: [],
    role: isConfiguredAdminEmail(email) ? "admin" : "user",
  }).returning();
  return { user: created, isNew: true };
}

export async function resolveUser(req: Request, res: Response, next: NextFunction) {
  const { userId, sessionClaims } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Get email and name from session claims
  let email = (sessionClaims?.email as string) ?? "";
  let name = (sessionClaims?.fullName as string) ?? undefined;

  // If we don't have email in session claims, fetch from Clerk API
  if (!email) {
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      email = clerkUser.emailAddresses.find(emailObj => emailObj.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? "";
      const firstName = clerkUser.firstName ?? "";
      const lastName = clerkUser.lastName ?? "";
      name = `${firstName} ${lastName}`.trim() || undefined;

      // Update the user in our database with the real email and name
      await db
        .update(usersTable)
        .set({ email, name })
        .where(eq(usersTable.clerkId, userId));
    } catch (err) {
      // If we can't fetch from Clerk API, fall back to placeholder but log the error
      req.log.warn({ userId, err: err instanceof Error ? err.message : String(err) }, "Failed to fetch user from Clerk API");
      // Keep the fallback below
    }
  }

  // Fallback to a unique placeholder if we still don't have email
  const finalEmail = email || `${userId}@noemail.jobquest`;
  const { user, isNew } = await getOrCreateUser(userId, finalEmail, name);
  (req as any).dbUser = user;

  // Send admin notification for new user if not already sent
  if (isNew && !user.adminNotificationSent) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const emailTemplate = getAdminNewUserEmailTemplate(
          user.name || "there",
          user.email,
          new Date().toLocaleString()
        );
        await mailService.sendTemplateEmail(adminEmail, emailTemplate, "admin_new_user_registered");

        // Mark admin notification as sent
        await db
          .update(usersTable)
          .set({ adminNotificationSent: true })
          .where(eq(usersTable.id, user.id));
      }
    } catch (error) {
      req.log.error({ error: error instanceof Error ? error.message : String(error), userId: user.id }, "Failed to send admin new user email");
    }
  }

  // Check if session has changed and send login email if needed
  const currentSessionId = sessionClaims?.sid ?? null;
  if (currentSessionId && user.lastSessionId !== currentSessionId) {
    try {
      const loginTime = new Date().toLocaleString();
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || "Unknown";
      const location = "Unknown"; // We don't have a geo IP service
      const emailTemplate = getLoginEmailTemplate(
        user.name || "there",
        loginTime,
        ipAddress,
        location
      );
      await mailService.sendTemplateEmail(user.email, emailTemplate, "user_login");

      // Send admin notification for user login
      try {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          const adminEmailTemplate = getAdminUserLoginEmailTemplate(
            user.name || "there",
            user.email,
            loginTime,
            user.id,
            ipAddress,
            req.headers['user-agent'] || "Unknown",
            "Regular"
          );
          await mailService.sendTemplateEmail(adminEmail, adminEmailTemplate, "admin_user_login");
        }
      } catch (adminEmailError) {
        // Log but don't fail the login email
        req.log.error({ error: adminEmailError.message, userId: user.id }, "Failed to send admin user login email");
      }

      // Update the user's lastSessionId in the database
      await db
        .update(usersTable)
        .set({ lastSessionId: currentSessionId })
        .where(eq(usersTable.id, user.id));
    } catch (emailError) {
      req.log.error({ error: emailError.message, userId: user.id }, "Failed to send login notification email");
    }
  }

  next();
}


export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).dbUser;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}