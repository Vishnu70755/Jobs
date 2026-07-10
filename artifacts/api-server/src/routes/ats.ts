import { Router, Request, Response } from "express";
import { db, atsReportsTable, resumesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { resolveUser } from "../middlewares/auth";
import { mailService } from "../lib/mail";
import { getATSAnalysisEmailTemplate } from "../lib/email-templates";

const router = Router();

function generateAtsAnalysis(resumeContent: string, jobDescription: string) {
  const jdWords = jobDescription.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const resumeWords = resumeContent.toLowerCase().split(/\W+/).filter(w => w.length > 3);

  const commonTechKeywords = [
    "react", "typescript", "javascript", "node", "python", "sql", "postgres", "mongodb",
    "aws", "docker", "kubernetes", "git", "rest", "api", "graphql", "nextjs", "express",
    "tailwind", "css", "html", "agile", "scrum", "leadership", "communication",
    "testing", "ci/cd", "devops", "machine learning", "data analysis",
  ];

  const jdKeywords = [...new Set(jdWords.filter(w => commonTechKeywords.includes(w) || jdWords.filter(jw => jw === w).length > 2))];
  const present = jdKeywords.filter(kw => resumeWords.includes(kw));
  const missing = jdKeywords.filter(kw => !resumeWords.includes(kw));

  const matchPct = jdKeywords.length > 0 ? Math.round((present.length / jdKeywords.length) * 100) : 60;
  const score = Math.min(100, Math.max(20, matchPct));

  return {
    score,
    matchPercentage: matchPct,
    presentKeywords: present.slice(0, 15),
    missingKeywords: missing.slice(0, 10),
    strengths: [
      "Strong technical skill alignment",
      "Clear work experience descriptions",
      "Quantified achievements present",
    ].slice(0, Math.max(1, Math.ceil(score / 35))),
    weaknesses: [
      ...(missing.length > 3 ? ["Missing key technical keywords from job description"] : []),
      ...(score < 60 ? ["Resume may not pass ATS filters automatically"] : []),
      "Consider adding more quantified metrics",
    ].slice(0, 3),
    suggestions: [
      ...missing.slice(0, 3).map(kw => `Add "${kw}" to your skills or experience section`),
      "Mirror the job description language more closely",
      "Add a tailored summary section",
      "Ensure file format is ATS-friendly (PDF or DOCX)",
    ].slice(0, 5),
    skillsAnalysis: { matched: present.slice(0, 10), missing: missing.slice(0, 8) },
  };
}

// POST /ats/analyze
router.post("/analyze", resolveUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).dbUser;
    const { resumeId, jobDescription, jobId } = req.body;

    const [resume] = await db.select().from(resumesTable).where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, user.id)));
    if (!resume) { res.status(404).json({ error: "Resume not found" }); return; }

    const content = resume.content ?? resume.name;
    const analysis = generateAtsAnalysis(content, jobDescription);

    const [report] = await db.insert(atsReportsTable).values({
      userId: user.id,
      resumeId,
      jobId: jobId ?? null,
      ...analysis,
    }).returning();

    // Send ATS analysis completion email
    try {
      const userEmail = user.email; // DB column -- always present
      if (userEmail) {
        // Extract top suggestions (limit to 3 for email)
        const suggestions = analysis.suggestions.slice(0, 3);
        const emailTemplate = getATSAnalysisEmailTemplate(
          user.name || "there",
          resume.name || "Untitled Resume",
          analysis.matchPercentage,
          suggestions
        );
// Line 84 — ATS analysis result
await mailService.sendTemplateEmail(userEmail, emailTemplate, "ats_analysis");
        // Log successful email send
        req.log.info({
          userId: user.id,
          email: userEmail,
          subject: emailTemplate.subject,
          timestamp: new Date().toISOString(),
          event: 'ats_analysis_email_sent'
        }, "ATS analysis email sent successfully");
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      req.log.error({
        userId: user.id,
        error: emailError.message,
        timestamp: new Date().toISOString(),
        event: 'ats_analysis_email_failed'
      }, "Failed to send ATS analysis email");
    }

    res.json(report);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /ats/reports
router.get("/reports", resolveUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).dbUser;
    const reports = await db.select().from(atsReportsTable)
      .where(eq(atsReportsTable.userId, user.id))
      .orderBy(desc(atsReportsTable.createdAt));
    res.json(reports);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /ats/reports/:id
router.get("/reports/:id", resolveUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).dbUser;
    const id = parseInt(req.params["id"] as string);
    const [report] = await db.select().from(atsReportsTable).where(and(eq(atsReportsTable.id, id), eq(atsReportsTable.userId, user.id)));
    if (!report) { res.status(404).json({ error: "Not found" }); return; }
    res.json(report);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;