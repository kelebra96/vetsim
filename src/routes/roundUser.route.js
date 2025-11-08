import { Router } from "express";
import roundController from "../controllers/roundUser.controller.js";
import {
  authenticate,
  authorizeAdminOrTeacher,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/createround", authenticate, authorizeAdminOrTeacher, roundController.create);
router.get("/roundcreate", authenticate, authorizeAdminOrTeacher, roundController.createRound);
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
router.get(
  "/roundsexisting",
  authenticate,
  authorizeAdminOrTeacher,
  roundController.roundsExisting
);
router.get(
  "/roundslist",
  authenticate,
  authorizeAdminOrTeacher,
  roundController.roundsList
);
router.get(
  "/semesterusers",
  authenticate,
  authorizeAdminOrTeacher,
  roundController.semesterUsersCount
);
router.get("/roundall", roundController.findAll);
router.get("/rounds", authenticate, roundController.rounds);
router.get("/roundid/:id", roundController.findById);
router.post("/roundupdate/:id", authenticate, roundController.update);
router.post("/close", roundController.closeRound);
router.get(
  "/roundsadmin",
  authenticate,
  authorizeAdminOrTeacher,
  roundController.roundsAdminView
);
router.get(
  "/roundsadmin/export",
  authenticate,
  authorizeAdminOrTeacher,
  roundController.exportCsv
);
router.post(
  "/roundsadmin/close",
  authenticate,
  authorizeAdminOrTeacher,
  roundController.bulkClose
);
router.post(
  "/roundsadmin/reopen",
  authenticate,
  authorizeAdminOrTeacher,
  roundController.bulkReopen
);
router.post(
  "/roundsadmin/delete",
  authenticate,
  authorizeAdminOrTeacher,
  roundController.bulkDelete
);
router.get(
  "/roundsadmin/count",
  authenticate,
  authorizeAdminOrTeacher,
  roundController.countFiltered
);

export default router;
