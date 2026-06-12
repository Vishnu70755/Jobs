import { Router } from "express";
import { db, aiChatsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { resolveUser } from "../middlewares/auth";
import { GoogleGenAI } from "@google/genai";

const router = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODE_SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are JobQuest AI, a helpful career assistant for job seekers. You give concise, actionable advice about job searching, career development, and the tech industry. Be encouraging, specific, and practical. Keep responses focused and under 300 words unless a longer response is genuinely needed.`,
  resume_review: `You are a professional resume reviewer and career coach with 10+ years of experience at top tech companies. When reviewing resumes, give specific, actionable feedback: identify strengths, gaps, and concrete improvements. Focus on quantifiable achievements, ATS optimization, and making the resume stand out. Keep feedback structured and practical.`,
  interview_prep: `You are an expert interview coach who has conducted hundreds of technical and behavioral interviews at FAANG and top startups. Help candidates prepare with STAR method coaching, technical question walkthroughs, and company-specific advice. Be encouraging but realistic about what interviewers look for.`,
  cover_letter: `You are a skilled copywriter specializing in job application materials. Help candidates write compelling, personalized cover letters that stand out. Focus on the opening hook, demonstrating genuine interest in the company, and connecting their experience to the role's needs. Provide actual draft text when asked.`,
  skill_gap: `You are a technical talent advisor who understands both the job market and technology trends. Identify skill gaps based on the user's background and target roles, then suggest specific learning paths, resources, and timelines. Be specific about which skills matter most for their goals.`,
};

// POST /ai/chat
router.post("/chat", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const { message, jobId, mode = "general" } = req.body;

    if (!message?.trim()) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    // Save user message
    await db.insert(aiChatsTable).values({
      userId: user.id,
      jobId: jobId ?? null,
      role: "user",
      content: message,
      mode,
    });

    // Fetch recent history
    const history = await db
      .select()
      .from(aiChatsTable)
      .where(eq(aiChatsTable.userId, user.id))
      .orderBy(desc(aiChatsTable.createdAt))
      .limit(10);

    const contextMessages = history
      .reverse()
      .slice(0, -1)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const systemPrompt =
      MODE_SYSTEM_PROMPTS[mode] ?? MODE_SYSTEM_PROMPTS.general;

    // Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
${systemPrompt}

Previous conversation:
${contextMessages}

User: ${message}
`,
    });

    const aiContent =
      response.text ??
      "I'm sorry, I couldn't generate a response. Please try again.";

    // Save assistant response
    const [aiMsg] = await db
      .insert(aiChatsTable)
      .values({
        userId: user.id,
        jobId: jobId ?? null,
        role: "assistant",
        content: aiContent,
        mode,
      })
      .returning();

    res.json(aiMsg);
  } catch (err: any) {
    req.log.error(err);

    if (err?.status === 401) {
      res
        .status(500)
        .json({ error: "Invalid Gemini API key. Please check your configuration." });
      return;
    }

    if (err?.status === 429) {
      res
        .status(429)
        .json({ error: "Rate limit reached. Please wait a moment and try again." });
      return;
    }

    res.status(500).json({
      error: "AI service unavailable. Please try again.",
    });
  }
});

// GET /ai/chat/history
router.get("/chat/history", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const jobId = req.query.jobId
      ? parseInt(req.query.jobId as string)
      : undefined;

    const history = await db
      .select()
      .from(aiChatsTable)
      .where(
        jobId
          ? and(
              eq(aiChatsTable.userId, user.id),
              eq(aiChatsTable.jobId, jobId)
            )
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