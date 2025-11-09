import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "express-flash";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(cookieParser()); // <== necessário para ler cookies
app.use(
  session({
    secret: "vetSimSecret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3 * 60 * 60 * 1000 }, // 3 horas
  })
);

app.use(flash());

import jwt from "jsonwebtoken";
import User from "./src/models/User.js";

app.use(async (req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "vetSimSecretKey"
      );
      // Traz nome e avatar do usuário para exibir no navbar
      try {
        const u = await User.findById(decoded.id)
          .select("name avatarUrl type code points level semester xpBySemester balance streakCount")
          .lean();
        if (u) {
          let pts = Number(u.points || 0);
          let sem = Number(u.semester || 1);
          let xpBySemester = Array.isArray(u.xpBySemester) ? u.xpBySemester : [];
          if (!Array.isArray(xpBySemester) || xpBySemester.length !== 8) {
            xpBySemester = [0,0,0,0,0,0,0,0];
          }
          // Recalcula pontos como soma dos semestres quando disponível
          const sumSem = xpBySemester.reduce((a,b)=> a + Number(b||0), 0);
          if (sumSem > 0 || pts === 0) pts = sumSem;
          // Nível sempre baseado em pontos acumulados (começa em 1)
          const lvl = Math.max(1, Math.floor(pts / 100) + 1);
            res.locals.user = {
              id: decoded.id,
              code: decoded.code,
              role: decoded.role,
              name: u.name,
              avatarUrl: u.avatarUrl || "",
              points: pts,
              level: lvl,
              semester: sem,
              xpBySemester,
              balance: Number(u.balance || 0),
              streakCount: Number(u.streakCount || 0),
            };
        } else {
          res.locals.user = { id: decoded.id, code: decoded.code, role: decoded.role };
        }
      } catch(_e) {
        res.locals.user = { id: decoded.id, code: decoded.code, role: decoded.role };
      }
    } catch (err) {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});



app.set("view engine", "ejs");

// database
import db from "./src/data/mongo.js";
db();

// routes
import userRoute from "./src/routes/user.route.js";
import rounduserRoute from "./src/routes/roundUser.route.js";
import homeRoute from "./src/routes/home.route.js";
import healthRoute from "./src/routes/health.route.js";
import settingsRoute from "./src/routes/settings.route.js";
import gamificationRoute from "./src/routes/gamification.route.js";
import logsRoute from "./src/routes/logs.route.js";

app.use("/", userRoute);
app.use("/", homeRoute);
app.use("/", rounduserRoute);
app.use("/", healthRoute);
app.use("/", settingsRoute);
app.use("/", gamificationRoute);
app.use("/", logsRoute);

app.listen(port, () => {
  console.log(`Server web running port:${port}`);
});
