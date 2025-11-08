import { Router } from "express";
import logsController from "../controllers/logs.controller.js";
import { authenticate, authorizeAdminOrTeacher } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/logs", authenticate, authorizeAdminOrTeacher, logsController.list);
router.get("/logs/export", authenticate, authorizeAdminOrTeacher, logsController.exportCsv);

export default router;
