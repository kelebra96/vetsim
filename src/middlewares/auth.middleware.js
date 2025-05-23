// src/middlewares/auth.middleware.js
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "vetSimSecretKey";

export function generateToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: "3h" });
}

export function authenticate(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) return res.redirect("/");

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect("/");
  }
}
