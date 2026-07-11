import { BaseImportService } from "./baseImportService";
import { ImportSourceEnum } from "@workspace/db";

/**
 * Naukri job import service
 */
export class NaukriImportService extends BaseImportService {
  constructor() {
    super("naukri" as ImportSourceEnum);
  }

  /**
   * Generate Naukri-specific mock data for Indian market
   */
  protected getMockData(): Array<any> {
    return [
      {
        title: "Java Developer",
        company: "Infosys",
        location: "Bangalore, Karnataka",
        workMode: "hybrid",
        experienceLevel: "mid-level",
        salaryMin: 800000,
        salaryMax: 1200000,
        salaryCurrency: "INR",
        description: "Java developer position with Spring Boot and microservices experience.",
        skills: ["Java", "Spring Boot", "Microservices", "REST", "SQL"],
        applyUrl: "https://naukri.com/job/view/600001",
        postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        title: "Python Developer",
        company: "TCS",
        location: "Pune, Maharashtra",
        workMode: "remote",
        experienceLevel: "mid-level",
        salaryMin: 700000,
        salaryMax: 1000000,
        salaryCurrency: "INR",
        description: "Develop backend applications using Python and Django framework.",
        skills: ["Python", "Django", "REST", "PostgreSQL", "AWS"],
        applyUrl: "https://naukri.com/job/view/600002",
        postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        title: "Frontend Developer",
        company: "Wipro",
        location: "Hyderabad, Telangana",
        workMode: "hybrid",
        experienceLevel: "mid-level",
        salaryMin: 600000,
        salaryMax: 900000,
        salaryCurrency: "INR",
        description: "Create responsive user interfaces using React and modern CSS frameworks.",
        skills: ["React", "HTML5", "CSS3", "JavaScript", "Redux"],
        applyUrl: "https://naukri.com/job/view/600003",
        postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        title: "Data Analyst",
        company: "HCLTech",
        location: "Chennai, Tamil Nadu",
        workMode: "onsite",
        experienceLevel: "entry-level",
        salaryMin: 400000,
        salaryMax: 600000,
        salaryCurrency: "INR",
        description: "Analyze business data and create reports using SQL and visualization tools.",
        skills: ["SQL", "Tableau", "Power BI", "Excel", "Data Modeling"],
        applyUrl: "https://naukri.com/job/view/600004",
        postedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      }
    ];
  }
}