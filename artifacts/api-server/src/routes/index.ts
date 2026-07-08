import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jobsRouter from "./jobs";
import applicationsRouter from "./applications";
import resumesRouter from "./resumes";
import atsRouter from "./ats";
import aiRouter from "./ai";
import analyticsRouter from "./analytics";
import notificationsRouter from "./notifications";
import usersRouter from "./users";
import adminRouter from "./admin";
import webhookRouter from "./webhooks";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/jobs", jobsRouter);
router.use("/applications", applicationsRouter);
router.use("/resumes", resumesRouter);
router.use("/ats", atsRouter);
router.use("/ai", aiRouter);
router.use("/analytics", analyticsRouter);
router.use("/notifications", notificationsRouter);
router.use("/users", usersRouter);
router.use("/admin", adminRouter);
router.use("/webhooks", webhookRouter);

export default router;