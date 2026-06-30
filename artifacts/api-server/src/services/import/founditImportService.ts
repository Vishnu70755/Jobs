import { BaseImportService } from "./baseImportService";
import { ImportSourceEnum } from "@workspace/db";
import { logger } from "../../lib/logger";

/**
 * Foundit job import service
 */
export class FounditImportService extends BaseImportService {
  constructor() {
    super("foundit" as ImportSourceEnum);
  }

  async scrape(): Promise<Array<any>> {
    logger.info({ source: this.source }, "Scraping Foundit jobs (placeholder)");

    // Simulate some delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return mock data for demonstration
    return [
      {
        title: "Digital Marketing Manager",
        company: "Amazon",
        location: "Hyderabad, India",
        workMode: "hybrid",
        experienceLevel: "senior",
        salaryMin: 1000000,
        salaryMax: 1500000,
        salaryCurrency: "INR",
        description: "Digital Marketing Manager position at Amazon...",
        skills: ["Digital Marketing", "SEO", "SEM", "Analytics"],
        applyUrl: "https://foundit.in/job/view/123456",
        postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }
    ];
  }
}