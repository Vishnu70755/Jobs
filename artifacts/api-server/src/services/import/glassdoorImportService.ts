import { BaseImportService } from "./baseImportService";
import { ImportSourceEnum } from "@workspace/db";
import { logger } from "../../lib/logger";

/**
 * Glassdoor job import service
 */
export class GlassdoorImportService extends BaseImportService {
  constructor() {
    super("glassdoor" as ImportSourceEnum);
  }

  async scrape(): Promise<Array<any>> {
    logger.info({ source: this.source }, "Scraping Glassdoor jobs (placeholder)");

    // Simulate some delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Return mock data for demonstration
    return [
      {
        title: "Senior Software Engineer",
        company: "Microsoft",
        location: "Redmond, WA",
        workMode: "hybrid",
        experienceLevel: "senior",
        salaryMin: 140000,
        salaryMax: 190000,
        salaryCurrency: "USD",
        description: "Senior Software Engineer position at Microsoft working on cloud services...",
        skills: ["C#", ".NET", "Azure", "Microservices"],
        applyUrl: "https://glassdoor.com/job/listing/123456",
        postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }
    ];
  }
}