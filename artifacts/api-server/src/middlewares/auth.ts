import { type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
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
  // Fallback to a unique placeholder if Clerk session claims don't include email
  const rawEmail = (sessionClaims?.email as string) ?? "";
  const email = rawEmail || `${userId}@noemail.jobquest`;
  const name = (sessionClaims?.fullName as string) ?? undefined;
  const user = await getOrCreateUser(userId, email, name);
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
