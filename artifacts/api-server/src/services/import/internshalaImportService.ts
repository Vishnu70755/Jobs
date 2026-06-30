import { BaseImportService } from "./baseImportService";
import { ImportSourceEnum } from "@workspace/db";
import { logger } from "../../lib/logger";

/**
 * Internshala job import service
 */
export class InternshalaImportService extends BaseImportService {
  constructor() {
    super("internshala" as ImportSourceEnum);
  }

  async scrape(): Promise<Array<any>> {
    logger.info({ source: this.source }, "Scraping Internshala jobs (placeholder)");

    // Simulate some delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return mock data for demonstration
    return [
      {
        title: "Content Writing Intern",
        company: "EduTech Startup",
        location: "Remote",
        workMode: "remote",
        experienceLevel: "intern",
        salaryMin: 10000,
        salaryMax: 15000,
        salaryCurrency: "INR",
        description: "Content writing internship for creating blog posts, social media content...",
        skills: ["Content Writing", "SEO", "Social Media", "Communication"],
        applyUrl: "https://internshala.com/internship/detail/content-writing-internship-123456",
        postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }
    ];
  }
}