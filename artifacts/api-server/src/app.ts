import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";
import { mailService } from "./lib/mail";
import { getSystemErrorEmailTemplate } from "./lib/email-templates";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standard Clerk middleware — reads CLERK_PUBLISHABLE_KEY and
// CLERK_SECRET_KEY directly from environment variables. The previous
// host-based key lookup (publishableKeyFromHost) was built for Replit's
// multi-domain hosting and throws on a plain Vercel/Render deployment,
// which is what was causing the HTTP 500 on every authenticated request.
app.use(clerkMiddleware());

app.use("/api", router);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  // Log error
  logger.error({ err, url: req.originalUrl, method: req.method, headers: req.headers }, "Unhandled error");
  // Determine status code
  const status = err.status || err.statusCode || 500;
  // Send email for server errors (status >= 500)
  if (status >= 500) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const emailTemplate = getSystemErrorEmailTemplate(
          err.message || "Unknown error",
          new Date().toISOString(),
          req.path || "Unknown"
        );
        // Send email (fire and forget, but log if fails)
        mailService.sendTemplateEmail(adminEmail, emailTemplate).catch(emailErr => {
          logger.error({ err: emailErr }, "Failed to send system error email");
        });
      }
    } catch (emailErr) {
      logger.error({ err: emailErr }, "Failed to send system error email");
    }
  }
  // Return error response
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

export default app;