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

app.use((req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "vetSimSecretKey"
      );
      res.locals.user = {
        id: decoded.id,
        code: decoded.code,
        role: decoded.role,
      };
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

app.use("/", userRoute);
app.use("/", homeRoute);
app.use("/", rounduserRoute);

app.listen(port, () => {
  console.log(`Server web running port:${port}`);
});
