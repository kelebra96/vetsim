import { Router } from "express"; 
import homeController from "../controllers/home.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/home", authenticate, homeController.home);
router.get("/sobre", homeController.sobre);



export default router;
