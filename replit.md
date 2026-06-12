# JobQuest — AI Job Search & Application Tracking Platform

An AI-powered SaaS platform for job seekers to discover jobs, track applications, analyze resumes, and get AI-assisted career guidance.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/job-platform run dev` — run the frontend (port 24090)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS, shadcn/ui, Framer Motion, Recharts, Wouter
- API: Express 5 with Clerk Express middleware
- Auth: Clerk (Replit-managed)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, jobs, applications, resumes, atsReports, aiChats, notifications, savedJobs)
- `artifacts/api-server/src/routes/` — Express route handlers (jobs, applications, resumes, ats, ai, analytics, notifications, users, admin)
- `artifacts/api-server/src/middlewares/auth.ts` — Clerk auth middleware (`requireAuth`, `resolveUser`, `requireAdmin`)
- `artifacts/job-platform/src/pages/` — React page components
- `artifacts/job-platform/src/components/` — Shared UI components and layout

## Architecture decisions

- Contract-first API: OpenAPI spec → codegen → typed hooks. Never hand-write what codegen produces.
- Clerk auth is proxied through the Express server (`/api/__clerk` path) for production compatibility.
- ATS analysis uses keyword matching (no external AI API required for first build).
- AI chatbot uses curated response templates per mode; can be upgraded to a real LLM via Replit AI Integrations.
- Jobs are seeded with 20 realistic listings from major sources. Real job sync engine can be added with BullMQ + cron.

## Product

- **Job Discovery**: Browse 20+ seeded jobs from LinkedIn, Indeed, Wellfound, etc. with filters by work mode, source, date posted
- **Application Tracker**: Kanban board tracking 11 statuses from Saved → Accepted
- **Resume Management**: Upload and manage multiple resume versions
- **ATS Analyzer**: Score resumes against job descriptions with keyword gap analysis
- **Analytics**: Charts showing application timeline, source breakdown, status distribution, funnel metrics
- **AI Assistant**: Chat interface with 7 modes (resume review, interview prep, cover letter, etc.)
- **Notifications**: Real-time notification feed with read/unread state
- **Admin Panel**: Platform statistics and user management (admin role required)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`
- Always run `pnpm --filter @workspace/db run push` after changing schema files in `lib/db/src/schema/`
- The `resolveUser` middleware auto-creates a DB user record from the Clerk session on first request
- Admin routes require `role: 'admin'` in the users table — set manually for admin accounts

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for auth setup and customization details
