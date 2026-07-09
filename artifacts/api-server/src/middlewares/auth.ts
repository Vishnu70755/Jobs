import { type Request, type Response, type NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export async function getOrCreateUser(clerkId: string, email: string, name?: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (existing.length > 0) return existing[0];

  const [created] = await db.insert(usersTable).values({
    clerkId,
    email,
    name: name ?? null,
    skills: [],
  }).returning();
  return created;
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
  const user = await getOrCreateUser(userId, finalEmail, name);
  (req as any).dbUser = user;
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
