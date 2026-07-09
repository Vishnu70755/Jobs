import { Router } from "express";
import { db, applicationsTable, jobsTable } from "@workspace/db";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { resolveUser } from "../middlewares/auth";

const router = Router();

// GET /analytics/overview
router.get("/overview", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.userId, user.id));

    const total = apps.length;
    const applied = apps.filter(a => a.status !== "saved").length;
    const interviews = apps.filter(a => ["interview_scheduled", "in_process", "offer_received", "accepted"].includes(a.status)).length;
    const offers = apps.filter(a => ["offer_received", "accepted"].includes(a.status)).length;
    const rejections = apps.filter(a => a.status === "rejected").length;
    const pending = apps.filter(a => ["applied", "under_review", "pending"].includes(a.status)).length;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 3600 * 1000);

    const thisWeek = apps.filter(a => new Date(a.createdAt) > weekAgo).length;
    const lastWeek = apps.filter(a => new Date(a.createdAt) > twoWeeksAgo && new Date(a.createdAt) <= weekAgo).length;

    res.json({
      totalApplications: total,
      responseRate: applied > 0 ? Math.round((interviews / applied) * 100) : 0,
      interviewRate: applied > 0 ? Math.round((interviews / applied) * 100) : 0,
      offerRate: interviews > 0 ? Math.round((offers / interviews) * 100) : 0,
      rejections,
      pending,
      offersReceived: offers,
      thisWeekApplications: thisWeek,
      lastWeekApplications: lastWeek,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /analytics/timeline
router.get("/timeline", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const period = (req.query.period as string) ?? "weekly";
    const days = period === "monthly" ? 180 : 56;
    const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);

    const apps = await db.select().from(applicationsTable)
      .where(and(eq(applicationsTable.userId, user.id), gte(applicationsTable.createdAt, cutoff)));

    const buckets = new Map<string, { count: number; interviews: number; offers: number }>();

    for (const app of apps) {
      const d = new Date(app.createdAt);
      let key: string;
      if (period === "monthly") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else {
        const monday = new Date(d);
        monday.setDate(d.getDate() - d.getDay() + 1);
        key = monday.toISOString().split("T")[0];
      }
      const existing = buckets.get(key) ?? { count: 0, interviews: 0, offers: 0 };
      existing.count++;
      if (["interview_scheduled", "in_process", "offer_received", "accepted"].includes(app.status)) existing.interviews++;
      if (["offer_received", "accepted"].includes(app.status)) existing.offers++;
      buckets.set(key, existing);
    }

    const result = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, data]) => ({ date, ...data }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /analytics/by-source
router.get("/by-source", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.userId, user.id));
    const total = apps.length;

    const sourceMap = new Map<string, number>();
    for (const app of apps) {
      const src = app.source ?? "Direct";
      sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
    }

    const result = [...sourceMap.entries()].map(([source, count]) => ({
      source,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /analytics/city-distribution
router.get("/city-distribution", resolveUser, async (req, res) => {
  try {
    const jobs = await db.select().from(jobsTable);
    const cityMap = new Map<string, number>();
    for (const job of jobs) {
      const location = job.location ?? '';
      let city = location.trim();
      if (city.includes(',')) {
        city = city.split(',')[0].trim();
      }
      if (city) {
        cityMap.set(city, (cityMap.get(city) ?? 0) + 1);
      }
    }
    const result = Array.from(cityMap.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /analytics/salary-bands
router.get("/salary-bands", resolveUser, async (req, res) => {
  try {
    const jobs = await db.select().from(jobsTable);
    const bands = [
      { range: [0, 6], label: '₹0–6 LPA' },
      { range: [6, 12], label: '₹6–12 LPA' },
      { range: [12, 20], label: '₹12–20 LPA' },
      { range: [20, 35], label: '₹20–35 LPA' },
      { range: [35, 50], label: '₹35–50 LPA' },
      { range: [50, Infinity], label: '₹50+ LPA' }
    ];
    const bandCounts = new Array(bands.length).fill(0);
    for (const job of jobs) {
      const min = job.salaryMin ?? 0;
      const max = job.salaryMax ?? 0;
      const avg = ((min ?? 0) + (max ?? 0)) / 2;
      for (let i = 0; i < bands.length; i++) {
        const [low, high] = bands[i].range;
        if ((avg >= low && avg < high) || (high === Infinity && avg >= low)) {
          bandCounts[i]++;
          break;
        }
      }
    }
    const result = bands.map((b, i) => ({ band: b.label, count: bandCounts[i] }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /analytics/state-distribution
router.get("/state-distribution", resolveUser, async (req, res) => {
  try {
    const jobs = await db.select().from(jobsTable);
    const stateMap = new Map<string, number>();
    const stateCityMap = new Map<string, string>(); // store a sample city for each state
    for (const job of jobs) {
      const location = job.location ?? '';
      let state = '';
      let city = '';
      if (location.includes(',')) {
        const parts = location.split(',');
        if (parts.length >= 2) {
          city = parts[0].trim();
          state = parts[1].trim();
        }
      } else {
        // fallback: treat whole as city, state unknown
        city = location.trim();
      }
      if (state) {
        stateMap.set(state, (stateMap.get(state) ?? 0) + 1);
        // store first encountered city as sample
        if (!stateCityMap.has(state)) {
          stateCityMap.set(state, city);
        }
      }
    }
    const total = jobs.length;
    const result = Array.from(stateMap.entries())
      .map(([state, count]) => ({
        state,
        city: stateCityMap.get(state) ?? '-',
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.percentage - a.percentage);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /analytics/by-status
router.get("/by-status", resolveUser, async (req, res) => {
  try {
    const user = (req as any).dbUser;
    const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.userId, user.id));
    const total = apps.length;

    const statusMap = new Map<string, number>();
    for (const app of apps) {
      statusMap.set(app.status, (statusMap.get(app.status) ?? 0) + 1);
    }

    const result = [...statusMap.entries()].map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;