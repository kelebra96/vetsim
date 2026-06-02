import { Router } from "express";
import courseController from "../controllers/course.controller.js";
import { authenticate, authorizeAdminOrTeacher } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/settings/courses", authenticate, authorizeAdminOrTeacher, courseController.listView);
router.post("/settings/courses", authenticate, authorizeAdminOrTeacher, courseController.create);
router.post("/settings/courses/:id/delete", authenticate, authorizeAdminOrTeacher, courseController.remove);
router.post("/settings/advance-semesters", authenticate, authorizeAdminOrTeacher, courseController.triggerAdvance);

export default router;
