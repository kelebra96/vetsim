import { Router } from "express";
import multer from "multer";
import path from "path";
import userController, { importStudents } from "../controllers/user.controller.js";
import { authenticate, authorizeAdminOrTeacher } from "../middlewares/auth.middleware.js";

const upload = multer({ storage: multer.memoryStorage() });
// Storage para avatar em disco
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/avatars");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext) ? ext : ".png";
    cb(null, `${req.user.id}-${Date.now()}${safeExt}`);
  },
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(png|jpe?g|gif|webp)$/i.test(file.mimetype);
    if (ok) return cb(null, true);
    return cb(new Error("TIPO_ARQUIVO_INVALIDO"));
  },
});

// Middleware para capturar erros do multer e retornar via flash
function avatarUploadSingle(req, res, next) {
  return avatarUpload.single("avatar")(req, res, function (err) {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        req.flash("error", "Arquivo muito grande. Máximo 2MB.");
      } else if (err.message === "TIPO_ARQUIVO_INVALIDO") {
        req.flash("error", "Tipo de arquivo inválido. Envie uma imagem PNG, JPG, JPEG, GIF ou WEBP.");
      } else {
        req.flash("error", "Erro no upload da imagem.");
      }
      return res.redirect("/profile");
    }
    next();
  });
}

const router = Router(); 

router.post("/login", userController.loginPost);
router.get("/", userController.login);
router.get("/register", userController.register);
router.post("/createuser", userController.create);
router.get("/userimport", userController.importForm);
router.post("/importcsv", upload.single("csvfile"), userController.importCsv);
router.post("/importstudents", authenticate, authorizeAdminOrTeacher, upload.single("file"), importStudents);
router.get("/userall", userController.findAll);
router.get("/userid/:id", userController.findById);
router.patch("/userupdate/:id", userController.update); 
// Perfil
router.get("/profile", authenticate, userController.profileView);
router.post("/profile", authenticate, avatarUploadSingle, userController.profileUpdate);
router.get("/users", authenticate, authorizeAdminOrTeacher, userController.listView);
// Admin/Teacher: editar e ativar/desativar usuários
router.get("/users/edit/:id", authenticate, authorizeAdminOrTeacher, userController.editView);
router.post("/users/edit/:id", authenticate, authorizeAdminOrTeacher, userController.adminUpdate);
router.post("/users/:id/toggle", authenticate, authorizeAdminOrTeacher, userController.toggleStatus);
// Ajuste de saldo VIDA (admin/professor)
router.post("/users/:id/balance", authenticate, authorizeAdminOrTeacher, userController.adjustBalance);
// Admin/Teacher: redefinir senha e ações em massa
router.post("/users/:id/resetpass", authenticate, authorizeAdminOrTeacher, userController.resetPassword);
router.post("/users/bulk", authenticate, authorizeAdminOrTeacher, userController.bulkStatus);
router.get("/logout", (req, res) => {
  res.clearCookie("token"); // remove o JWT
  req.session.destroy(() => {
    res.redirect("/"); // redireciona para login
  });
});
  

export default router; 
