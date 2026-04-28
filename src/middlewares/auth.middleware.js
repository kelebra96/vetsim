// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "vetSimSecretKey";

export function generateToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: "3h" });
}

export function authenticate(req, res, next) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return res.redirect("/");

  try {
    const decoded = jwt.verify(token, secret);

    // Sanitizando o conteúdo do token
    req.user = {
      id: decoded.id,
      code: decoded.code,
      // Usa o role do banco (populado pelo middleware global) se disponível;
      // garante que mudanças de papel no banco tenham efeito sem re-login.
      role: res.locals.user?.role || decoded.role,
    };

    next();
  } catch (err) {
    console.warn("Token inválido ou expirado:", err.message);
    return res.redirect("/");
  }
}

export function authorizeAdminOrTeacher(req, res, next) {
  if (req.user?.role === "admin" || req.user?.role === "teacher") return next();
  return res.status(403).render("unauthorized");
}

