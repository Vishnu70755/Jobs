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
    logger.info({ source: this.source }, "Scraping Glassdoor jobs (India-focused)");

    // Simulate some delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return mock data for Indian jobs
    // In production, replace this with actual scraping logic
    return this.generateGlassdoorMockData();
  }

  /**
   * Generate Glassdoor-specific mock data for Indian market
   */
  protected generateGlassdoorMockData(): Array<any> {
    return [
      {
        title: "Senior Software Engineer",
        company: "Microsoft India",
        location: "Bangalore, Karnataka",
        workMode: "hybrid",
        experienceLevel: "senior",
        salaryMin: 1800000,
        salaryMax: 2500000,
        salaryCurrency: "INR",
        description: "Lead software development for Azure cloud services in India.",
        skills: ["C#", ".NET", "Azure", "Microservices", "SQL"],
        applyUrl: "https://glassdoor.com/job-listing?id=500001",
        postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        title: "Data Scientist",
        company: "Amazon India",
        location: "Hyderabad, Telangana",
        workMode: "remote",
        experienceLevel: "senior",
        salaryMin: 1600000,
        salaryMax: 2400000,
        salaryCurrency: "INR",
        description: "Build machine learning models for retail forecasting and recommendation systems.",
        skills: ["Python", "Machine Learning", "TensorFlow", "SQL", "Tableau"],
        applyUrl: "https://glassdoor.com/job-listing?id=500002",
        postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        title: "DevOps Engineer",
        company: "Google India",
        location: "Pune, Maharashtra",
        workMode: "onsite",
        experienceLevel: "mid-level",
        salaryMin: 1200000,
        salaryMax: 1800000,
        salaryCurrency: "INR",
        description: "Manage Kubernetes clusters and CI/CD pipelines for Google Cloud Platform.",
        skills: ["Docker", "Kubernetes", "Jenkins", "Terraform", "AWS", "GCP"],
        applyUrl: "https://glassdoor.com/job-listing?id=500003",
        postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        title: "Full Stack Developer",
        company: "Meta India",
        location: "Gurgaon, Haryana",
        workMode: "hybrid",
        experienceLevel: "mid-level",
        salaryMin: 1000000,
        salaryMax: 1500000,
        salaryCurrency: "INR",
        description: "Develop and maintain web applications using React and Node.js.",
        skills: ["React", "Node.js", "MongoDB", "Express", "JavaScript"],
        applyUrl: "https://glassdoor.com/job-listing?id=500004",
        postedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      }
    ];
  }
}