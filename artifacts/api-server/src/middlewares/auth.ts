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

export async function getOrCreateUser(clerkId: string, email: string, name?: string): Promise<{ user: typeof usersTable.$inferSelect; isNew: boolean }> {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (existing.length > 0) {
    return { user: existing[0], isNew: false };
  }

  const [created] = await db.insert(usersTable).values({
    clerkId,
    email,
    name: name ?? null,
    skills: [],
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
  let name = (sessionClaims?.fullName as string) ?? "";

  // If we don't have email in session claims, fetch from Clerk API
  if (!email) {
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      email = clerkUser.emailAddresses.find(emailObj => emailObj.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? "";
      const firstName = clerkUser.firstName ?? "";
      const lastName = clerkUser.lastName ?? "";
      name = `${firstName} ${lastName}`.trim() || "";

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
        await mailService.sendTemplateEmail(adminEmail, emailTemplate);

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
      const ipAddress = (typeof req.ip === 'string' ? req.ip :
    (Array.isArray(req.ip) ? req.ip[0] : '')) ||
  (typeof req.headers['x-forwarded-for'] === 'string' ? req.headers['x-forwarded-for'] :
    (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : '')) ||
  (typeof req.connection.remoteAddress === 'string' ? req.connection.remoteAddress : '') ||
  "Unknown";
      const location = "Unknown"; // We don't have a geo IP service
      const emailTemplate = getLoginEmailTemplate(
        user.name || "there",
        loginTime,
        ipAddress,
        location
      );
      await mailService.sendTemplateEmail(user.email, emailTemplate);

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
            (typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] :
              (Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : '')) ||
              "Unknown",
            "Regular"
          );
          await mailService.sendTemplateEmail(adminEmail, adminEmailTemplate);
        }
      } catch (adminEmailError) {
        // Log but don't fail the login email
        const errorMessage = adminEmailError instanceof Error ? adminEmailError.message : String(adminEmailError);
        req.log.error({ error: errorMessage, userId: user.id }, "Failed to send admin user login email");
      }

      // Update the user's lastSessionId in the database
      await db
        .update(usersTable)
        .set({ lastSessionId: currentSessionId })
        .where(eq(usersTable.id, user.id));
    } catch (emailError) {
      const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
      req.log.error({ error: errorMessage, userId: user.id }, "Failed to send login notification email");
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