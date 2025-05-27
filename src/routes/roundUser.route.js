import { Router } from "express";
import roundController from "../controllers/roundUser.controller.js";
import {
  authenticate,
  authorizeAdminOrTeacher,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/createround", roundController.create);
router.get("/roundcreate", roundController.createRound);
router.get(
  "/roundclose",
  authenticate,
  authorizeAdminOrTeacher,
  roundController.roundCloseForm
);
router.post(
  "/roundclose",
  authenticate,
  authorizeAdminOrTeacher,
  roundController.closeRound
);
router.get("/roundall", roundController.findAll);
router.get("/rounds", authenticate, roundController.rounds);
router.get("/roundid/:id", roundController.findById);
router.post("/roundupdate/:id", roundController.update);
router.post("/close", roundController.closeRound);

export default router;
