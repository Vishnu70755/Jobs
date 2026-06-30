import { Router } from "express";
import { db, aiChatsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { resolveUser } from "../middlewares/auth";
import OpenAI from "openai";

const router = Router();

/**
 * OpenAI client (safe initialization)
 */
const openai: OpenAI | null = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

/**
 * System prompts per mode
 */
const MODE_SYSTEM_PROMPTS: Record<string, string> = {
  general:
    "You are JobQuest AI, a helpful career assistant for job seekers. Keep responses concise, actionable, and under 300 words unless necessary.",

  resume_review:
    "You are a professional resume reviewer. Give structured, actionable feedback focusing on ATS optimization, clarity, and measurable impact.",

  interview_prep:
    "You are an expert interview coach. Help with STAR method answers, technical prep, and realistic interview expectations.",

  cover_letter:
    "You are a skilled copywriter for job applications. Generate strong, personalized cover letters with compelling hooks.",

  skill_gap:
    "You are a technical career advisor. Identify skill gaps and suggest structured learning paths with priorities.",
};

// =========================
// POST /ai/chat
// =========================
router.post("/chat", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const { message, jobId, mode = "general" } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
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
      .limit(20);

    const contextMessages = history
      .reverse()
      .slice(0, -1)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const systemPrompt =
      MODE_SYSTEM_PROMPTS[mode] ?? MODE_SYSTEM_PROMPTS.general;

    // OpenAI not configured
    if (!openai) {
      return res.status(503).json({
        error: "AI service is not configured. Please set OPENAI_API_KEY.",
      });
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...contextMessages,
        { role: "user", content: message },
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const aiContent =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response.";

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

    return res.json(aiMsg);
  } catch (err: any) {
    req.log?.error?.(err);

    if (err?.status === 401 || err?.code === "invalid_api_key") {
      return res.status(500).json({
        error: "Invalid OpenAI API key. Please check your configuration.",
      });
    }

    if (err?.status === 429) {
      return res.status(429).json({
        error: "Rate limit reached. Please try again later.",
      });
    }

    return res.status(500).json({
      error: "AI service unavailable. Please try again.",
    });
  }
});

// =========================
// GET /ai/chat/history
// =========================
router.get("/chat/history", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;

    const jobId = req.query.jobId
      ? Number(req.query.jobId)
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

    return res.json(history.reverse());
  } catch (err: any) {
    req.log?.error?.(err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default router;