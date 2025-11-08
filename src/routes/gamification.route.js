import { Router } from "express";
import gamificationController from "../controllers/gamification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/me/xp", authenticate, gamificationController.myXP);
router.get("/me/streak", authenticate, (req, res)=> import("../controllers/gamification.controller.js").then(m=>m.getStreak(req,res)));
router.post("/me/streak/tick", authenticate, (req, res)=> import("../controllers/gamification.controller.js").then(m=>m.tickStreakToday(req,res)));

export default router;
