import { Router } from "express";
import { db, aiChatsTable, jobsTable, resumesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { resolveUser } from "../middlewares/auth";

const router = Router();

const AI_RESPONSES: Record<string, string[]> = {
  resume_review: [
    "Your resume has strong technical skills but could benefit from more quantified achievements. Try adding metrics like 'increased performance by 40%' or 'reduced load time by 2 seconds'.",
    "The summary section is compelling. Consider tailoring it more specifically to each job description you apply for. Your experience section could highlight impact over responsibilities.",
    "Great structure! One suggestion: move your most impressive achievement to the top bullet under each role. Recruiters spend only 6-7 seconds on initial screening.",
  ],
  interview_prep: [
    "For behavioral questions, use the STAR method: Situation, Task, Action, Result. For your background, prepare 2-3 stories that showcase leadership, problem-solving, and collaboration.",
    "Common technical questions to prepare: system design basics, algorithm complexity, and architecture decisions you've made. Practice explaining your thought process aloud.",
    "Research the company's engineering blog, recent product updates, and tech stack. Ask thoughtful questions like 'What does your deployment process look like?' or 'How do you handle on-call incidents?'",
  ],
  cover_letter: [
    "Here's a cover letter opening: 'As a passionate software engineer with X years building scalable web applications, I was excited to discover the [Role] position at [Company]. Your focus on [specific value] aligns perfectly with my experience in [relevant skill].'",
    "A strong cover letter should: 1) Hook with your biggest relevant achievement, 2) Show you understand the company's challenges, 3) Explain specifically how you'll add value. Keep it to 3 paragraphs.",
    "Avoid starting with 'I am applying for...' Instead, open with your most impressive achievement related to the role. Make it memorable in the first sentence.",
  ],
  skill_gap: [
    "Based on your profile, here are the top skills to develop for senior roles: System Design, Leadership/mentoring, Cloud infrastructure (AWS/GCP), and distributed systems patterns.",
    "For the current market, I recommend focusing on: TypeScript (if not already strong), testing practices (TDD/integration), CI/CD pipelines, and one cloud platform deeply.",
    "Learning path suggestion: 1) Complete a cloud certification (AWS Solutions Architect), 2) Contribute to open source, 3) Build a side project demonstrating distributed systems knowledge.",
  ],
  general: [
    "I'm here to help with your job search! I can review your resume, help prepare for interviews, draft cover letters, identify skill gaps, or provide career guidance. What would you like to work on?",
    "Great question! Based on current market trends, companies are prioritizing candidates with strong fundamentals, system design knowledge, and collaborative soft skills. How can I help you showcase these?",
    "The job market is competitive right now. Focus on quality over quantity — tailor each application, build genuine connections, and make sure your GitHub/portfolio showcases your best work.",
  ],
};

function getAiResponse(message: string, mode: string): string {
  const responses = AI_RESPONSES[mode] ?? AI_RESPONSES.general;
  return responses[Math.floor(Math.random() * responses.length)];
}

// POST /ai/chat
router.post("/chat", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const { message, jobId, resumeId, mode = "general" } = req.body;

    const [userMsg] = await db.insert(aiChatsTable).values({
      userId: user.id,
      jobId: jobId ?? null,
      role: "user",
      content: message,
      mode,
    }).returning();

    const aiContent = getAiResponse(message, mode);

    const [aiMsg] = await db.insert(aiChatsTable).values({
      userId: user.id,
      jobId: jobId ?? null,
      role: "assistant",
      content: aiContent,
      mode,
    }).returning();

    res.json(aiMsg);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /ai/chat/history
router.get("/chat/history", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const jobId = req.query.jobId ? parseInt(req.query.jobId as string) : undefined;

    const history = await db.select().from(aiChatsTable)
      .where(
        jobId
          ? and(eq(aiChatsTable.userId, user.id), eq(aiChatsTable.jobId, jobId))
          : eq(aiChatsTable.userId, user.id)
      )
      .orderBy(desc(aiChatsTable.createdAt))
      .limit(50);

    res.json(history.reverse());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
