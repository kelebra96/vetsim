import { Router } from "express";
import gamificationController from "../controllers/gamification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/me/xp", authenticate, gamificationController.myXP);

export default router;

