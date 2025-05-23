import userService from "../services/user.service.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../middlewares/auth.middleware.js";

const register = async (req, res) => {
  res.render('authenticate/register')
};
const loginPost = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    req.flash("error", "Usuário não encontrado.");
    return res.redirect("/");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    req.flash("error", "Senha inválida.");
    return res.redirect("/");
  }

  const token = generateToken({
    id: user._id,
    code: user.code, // ESSENCIAL para /rounds
    role: user.type,
  });

  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 3 * 60 * 60 * 1000,
  });

  res.redirect("/home");
};
const login = async (req, res) => {
  res.render("authenticate/login", { messages: req.flash("error") });
};
const create = async (req, res) => {
  const { name, code, email, semester, password, status } = req.body;
  if (
    !name ||
    !code ||
    !email ||
    !semester ||
    !password 
  ) {
    req.flash("error", "Preencha todos os campos obrigatórios.");
    return res.redirect("/"); // ou outra rota que leve ao formulário
  }

  try {
    const user = await userService.createService(req.body);
    if (!user) {
      req.flash("error", "Erro ao criar usuário.");
      return res.redirect("/");
    }

    req.flash("success", "Usuário criado com sucesso.");
    return res.redirect("/home");
  } catch (err) {
    req.flash("error", err.message);
    return res.redirect("/");
  }
};
const findAll = async (req, res) => {
  try {
    const users = await userService.findAllService();
    if (users.length === 0) {
      return res.status(400).send({ message: "There are no registered users" });
    }
    res.send(users);
  } catch (err) {
    send.status(500).send({ message: err.message });
  }
};
const findById = async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
const update = async (req, res) => {
  try {
    const { name, code, email, semester, password, status } = req.body;
    if (!name && !code && !email && !semester && !password, !status) {
      res
        .status(400)
        .send({ menssage: "Submit at least one field for update" });
    }
    const { id, user } = req;
    console.log(`Esse é o ID esperado:${id}`);
    await userService.updateService(id, name, code, email, semester, password, status);
    res.send({ message: "User successfully updated!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
export default { register, loginPost, login, create, findAll, findById, update };
