import { Router } from "express";
import settingsController from "../controllers/settings.controller.js";
import { authenticate, authorizeAdminOrTeacher } from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
  "/settings/costs",
  authenticate,
  authorizeAdminOrTeacher,
  settingsController.getCosts
);

router.post(
  "/settings/costs",
  authenticate,
  authorizeAdminOrTeacher,
  settingsController.saveCosts
);

export default router;

