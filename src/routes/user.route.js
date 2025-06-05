import { Router } from "express";
import multer from "multer";
import userController from "../controllers/user.controller.js";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router(); 

router.post("/login", userController.loginPost);
router.get("/", userController.login);
router.get("/register", userController.register);
router.post("/createuser", userController.create);
router.get("/userimport", userController.importForm);
router.post("/importcsv", upload.single("csvfile"), userController.importCsv);
router.get("/userall", userController.findAll);
router.get("/userid/:id", userController.findById);
router.patch("/userupdate/:id", userController.update); 
router.get("/logout", (req, res) => {
  res.clearCookie("token"); // remove o JWT
  req.session.destroy(() => {
    res.redirect("/"); // redireciona para login
  });
});
  

export default router; 
