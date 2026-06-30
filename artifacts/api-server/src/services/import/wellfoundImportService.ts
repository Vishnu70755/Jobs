import { BaseImportService } from "./baseImportService";
import { ImportSourceEnum } from "@workspace/db";
import { logger } from "../../lib/logger";

/**
 * Wellfound (formerly AngelList) job import service
 */
export class WellfoundImportService extends BaseImportService {
  constructor() {
    super("wellfound" as ImportSourceEnum);
  }

  async scrape(): Promise<Array<any>> {
    logger.info({ source: this.source }, "Scraping Wellfound jobs (placeholder)");

    // Simulate some delay
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Return mock data for demonstration
    return [
      {
        title: "Senior Full Stack Engineer",
        company: "Stripe",
        location: "San Francisco, CA (Remote OK)",
        workMode: "remote",
        experienceLevel: "senior",
        salaryMin: 160000,
        salaryMax: 220000,
        salaryCurrency: "USD",
        description: "Senior Full Stack Engineer position at Stripe working on payment infrastructure...",
        skills: ["React", "Node.js", "TypeScript", "GraphQL", "PostgreSQL"],
        applyUrl: "https://wellfound.com/job/123456-senior-full-stack-engineer-stripe",
        postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }
    ];
  }
}