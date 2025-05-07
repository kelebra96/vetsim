import { Router } from "express"; 
import roundController from "../controllers/roundUser.controller.js";

const router = Router(); 

router.post("/", roundController.create); 
router.get("/", roundController.findAll); 
router.get("/:id", roundController.findById);
router.patch("/:id", roundController.update); 
router.post("/close", roundController.closeRound);


export default router; 
