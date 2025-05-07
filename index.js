import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const port = process.env.PORT || 8080;
//files static
app.use(express.json());
//databases
import db from "./src/data/mongo.js";
db();
//ImportRoutes
import userRoute from "./src/routes/user.route.js";
import rounduserRoute from "./src/routes/roundUser.route.js";

//Routes
app.use("/user", userRoute);
app.use("/rounduser", rounduserRoute);


app.listen(port, () => {
  console.log(`Server web running port:${port}`);
});
