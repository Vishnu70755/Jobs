import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";

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

export default app;