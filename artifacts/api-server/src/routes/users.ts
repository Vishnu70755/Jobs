import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { resolveUser } from "../middlewares/auth";

const router = Router();

// GET /users/me
router.get("/me", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    res.json({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      title: user.title,
      location: user.location,
      skills: user.skills ?? [],
      experience: user.experience,
      targetRole: user.targetRole,
      linkedinUrl: user.linkedinUrl,
      githubUrl: user.githubUrl,
      role: user.role,
      createdAt: user.createdAt,
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
    const { name, title, location, skills, experience, targetRole, linkedinUrl, githubUrl } = req.body;

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

export default router;
