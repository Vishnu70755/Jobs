import app from "./app";
import { logger } from "./lib/logger";
import { db, jobsTable } from "@workspace/db";
import { startScheduler } from "./scheduler";
import { sql } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedIndianJobs() {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobsTable)
      .where(sql`location LIKE '%India%'`);

    if (Number(count) >= 11) return;

    await db.insert(jobsTable).values([
      {
        title: "Frontend Developer",
        company: "Google",
        location: "Bangalore, India",
        workMode: "hybrid",
        experienceLevel: "Mid-level",
        salaryMin: 1800000,
        salaryMax: 2400000,
        salaryCurrency: "INR",
        description: "Build and maintain Google's consumer-facing web products. You'll work with modern JavaScript frameworks and collaborate with design, PM, and backend teams to ship impactful features to billions of users.\n\nYou'll be responsible for crafting pixel-perfect UIs, optimizing web performance, and ensuring accessibility across all Google web surfaces.",
        skills: ["React", "TypeScript", "JavaScript", "CSS", "Web Performance"],
        source: "LinkedIn",
        applyUrl: "https://careers.google.com",
        isNew: true,
        isHot: true,
        postedAt: new Date("2026-06-14"),
      },
      {
        title: "Software Engineer II",
        company: "Microsoft",
        location: "Hyderabad, India",
        workMode: "hybrid",
        experienceLevel: "Mid-level",
        salaryMin: 2000000,
        salaryMax: 2800000,
        salaryCurrency: "INR",
        description: "Join Microsoft's India Development Centre and work on Azure cloud services used by millions of enterprises worldwide. You'll design, develop, and ship production code for large-scale distributed systems.\n\nCollaborate with global teams to build features that impact the Azure ecosystem and power digital transformation for businesses across industries.",
        skills: ["Java", "Azure", "Distributed Systems", "C#", "Microservices"],
        source: "LinkedIn",
        applyUrl: "https://careers.microsoft.com",
        isNew: true,
        isHot: true,
        postedAt: new Date("2026-06-13"),
      },
      {
        title: "Full Stack Developer",
        company: "Amazon",
        location: "Chennai, India",
        workMode: "onsite",
        experienceLevel: "Senior",
        salaryMin: 2200000,
        salaryMax: 3200000,
        salaryCurrency: "INR",
        description: "Amazon's India tech hub is expanding rapidly. As a Full Stack Developer you'll build internal tools and customer-facing features for Amazon's e-commerce and logistics platforms used across South Asia.\n\nYou'll own entire feature development from database schema design to React UI, working in an agile environment with direct product impact.",
        skills: ["Node.js", "React", "AWS", "PostgreSQL", "TypeScript"],
        source: "Indeed",
        applyUrl: "https://amazon.jobs",
        isNew: true,
        isHot: false,
        postedAt: new Date("2026-06-12"),
      },
      {
        title: "Senior UI Developer",
        company: "Adobe",
        location: "Noida, India",
        workMode: "remote",
        experienceLevel: "Senior",
        salaryMin: 1600000,
        salaryMax: 2200000,
        salaryCurrency: "INR",
        description: "Adobe's Noida office works on Creative Cloud products used by designers, artists, and creators worldwide. You'll build elegant, accessible UI components for Adobe Express and Photoshop Web.\n\nRemote-first role with flexible hours. Work closely with world-class designers and frontend engineers to craft beautiful, high-performance web experiences.",
        skills: ["React", "TailwindCSS", "Figma", "TypeScript", "Accessibility"],
        source: "Wellfound",
        applyUrl: "https://adobe.com/careers",
        isNew: true,
        isHot: false,
        postedAt: new Date("2026-06-11"),
      },
      {
        title: "Frontend Engineer",
        company: "Infosys",
        location: "Pune, India",
        workMode: "onsite",
        experienceLevel: "Entry-level",
        salaryMin: 700000,
        salaryMax: 1200000,
        salaryCurrency: "INR",
        description: "Infosys is hiring enthusiastic Frontend Engineers for its Pune Innovation Hub. You'll work on enterprise-grade web applications for global clients across banking, insurance, and retail sectors.\n\nGreat opportunity for early-career developers to learn from experienced mentors and contribute to real-world projects. Structured learning programs and career development support provided.",
        skills: ["HTML", "CSS", "JavaScript", "Angular", "Bootstrap"],
        source: "Naukri",
        applyUrl: "https://infosys.com/careers",
        isNew: false,
        isHot: false,
        postedAt: new Date("2026-06-09"),
      },
      {
        title: "Software Engineer",
        company: "TCS",
        location: "Hyderabad, Telangana",
        workMode: "hybrid",
        experienceLevel: "Entry-level",
        salaryMin: 550000,
        salaryMax: 900000,
        salaryCurrency: "INR",
        description: "Tata Consultancy Services is one of India's largest IT employers. Join our digital transformation team and work on enterprise applications for BFSI and healthcare clients globally.\n\nYou will be trained on the latest technologies and mentored by senior engineers. TCS offers strong career growth, international exposure, and one of India's best employee benefits programs.",
        skills: ["Java", "Spring Boot", "SQL", "REST APIs", "Git"],
        source: "Naukri",
        applyUrl: "https://careers.tcs.com",
        isNew: true,
        isHot: false,
        postedAt: new Date("2026-06-15"),
      },
      {
        title: "Senior Software Engineer",
        company: "Wipro",
        location: "Bengaluru, Karnataka",
        workMode: "hybrid",
        experienceLevel: "Mid-level",
        salaryMin: 1200000,
        salaryMax: 1800000,
        salaryCurrency: "INR",
        description: "Wipro's Digital Business Unit is hiring senior engineers to build cloud-native applications for Fortune 500 clients. You'll lead feature development, mentor junior developers, and own end-to-end delivery of modules.\n\nWork on cutting-edge cloud and AI projects with exposure to global clients and cross-cultural teams.",
        skills: ["Python", "AWS", "Docker", "Kubernetes", "Microservices"],
        source: "LinkedIn",
        applyUrl: "https://careers.wipro.com",
        isNew: true,
        isHot: true,
        postedAt: new Date("2026-06-14"),
      },
      {
        title: "Lead Developer",
        company: "HCL Technologies",
        location: "Chennai, Tamil Nadu",
        workMode: "onsite",
        experienceLevel: "Senior",
        salaryMin: 1500000,
        salaryMax: 2200000,
        salaryCurrency: "INR",
        description: "HCL Technologies is looking for an experienced Lead Developer to join our Engineering R&D Services division. You'll architect and deliver software solutions for global OEM clients in automotive and manufacturing sectors.\n\nLead a team of 5–8 engineers, conduct code reviews, and collaborate directly with clients to translate requirements into technical solutions.",
        skills: ["C++", "Embedded Systems", "Python", "Linux", "Agile"],
        source: "Glassdoor",
        applyUrl: "https://careers.hcltech.com",
        isNew: false,
        isHot: true,
        postedAt: new Date("2026-06-10"),
      },
      {
        title: "Associate Software Engineer",
        company: "Tech Mahindra",
        location: "Pune, Maharashtra",
        workMode: "hybrid",
        experienceLevel: "Entry-level",
        salaryMin: 450000,
        salaryMax: 750000,
        salaryCurrency: "INR",
        description: "Tech Mahindra's 5G and Telecom division is expanding fast. As an Associate Engineer you'll work on next-gen network software, BSS/OSS systems, and AI-powered telecom solutions for major operators worldwide.\n\nIdeal for fresh graduates or candidates with 0–2 years of experience. Comprehensive training provided.",
        skills: ["Java", "Python", "Telecom Protocols", "SQL", "Linux"],
        source: "Naukri",
        applyUrl: "https://careers.techmahindra.com",
        isNew: true,
        isHot: false,
        postedAt: new Date("2026-06-16"),
      },
      {
        title: "Technology Analyst",
        company: "Accenture India",
        location: "Mumbai, Maharashtra",
        workMode: "hybrid",
        experienceLevel: "Mid-level",
        salaryMin: 1000000,
        salaryMax: 1600000,
        salaryCurrency: "INR",
        description: "Accenture India's Technology practice is hiring Technology Analysts to deliver digital transformation projects for BFSI clients. You'll design scalable solutions using cloud platforms and modern frameworks.\n\nExcellent learning and development opportunities with access to Accenture's global training programs, certifications, and innovation labs.",
        skills: ["Salesforce", "Azure", "React", "Node.js", "Agile"],
        source: "LinkedIn",
        applyUrl: "https://accenture.com/in-en/careers",
        isNew: true,
        isHot: true,
        postedAt: new Date("2026-06-13"),
      },
      {
        title: "Senior Developer",
        company: "Cognizant",
        location: "Bengaluru, Karnataka",
        workMode: "remote",
        experienceLevel: "Mid-level",
        salaryMin: 1300000,
        salaryMax: 1900000,
        salaryCurrency: "INR",
        description: "Cognizant's Digital Engineering practice is looking for a Senior Developer with strong full-stack skills to work on digital products for US-based retail and healthcare clients.\n\nRemote-first role with structured sprint cycles, monthly team offsites, and excellent exposure to modern engineering practices. US client interaction required.",
        skills: ["React", "Node.js", "PostgreSQL", "GraphQL", "AWS"],
        source: "Instahyre",
        applyUrl: "https://careers.cognizant.com",
        isNew: true,
        isHot: false,
        postedAt: new Date("2026-06-12"),
      },
    ]);

    logger.info("Seeded 11 Indian company jobs");
  } catch (err) {
    logger.warn({ err }, "Job seed skipped or failed");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Run migrations automatically on startup
  try {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "../../../lib/db/migrations"),
    });
    logger.info("Database migrations completed");
  } catch (err) {
    logger.warn({ err }, "Migration failed or already up to date");
  }

  await seedIndianJobs();
  startScheduler();
});
