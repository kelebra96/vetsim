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
    code: user.code,
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
    res.status(500).send({ message: err.message });
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
    if (!name && !code && !email && !semester && !password && !status) {
      return res
        .status(400)
        .send({ message: "Submit at least one field for update" });
    }
    const { id } = req.params;
    console.log(`Esse é o ID esperado:${id}`);
    await userService.updateService(id, name, code, email, semester, password, status);
    res.send({ message: "User successfully updated!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const importForm = async (req, res) => {
  res.render("user/import", {
    messages: req.flash("error"),
    success: req.flash("success"),
  });
};

const importCsv = async (req, res) => {
  if (!req.file) {
    req.flash("error", "Nenhum arquivo enviado.");
    return res.redirect("/userimport");
  }

  try {
    const csv = req.file.buffer.toString("utf-8");
    const lines = csv.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      req.flash("error", "Arquivo CSV vazio ou inválido.");
      return res.redirect("/userimport");
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    let created = 0;

    for (const line of lines.slice(1)) {
      const values = line.split(",").map((v) => v.trim());
      if (values.length !== headers.length) continue;
      const data = {};
      headers.forEach((h, idx) => {
        data[h] = values[idx];
      });

      if (data.semester) data.semester = Number(data.semester);
      if (data.code) data.code = Number(data.code);
      if (data.status !== undefined)
        data.status = data.status.toLowerCase() === "true" || data.status === "1";

      try {
        await userService.createService(data);
        created++;
      } catch (err) {
        console.error("Erro ao importar usuário:", err.message);
      }
    }

    req.flash("success", `${created} usuários importados com sucesso.`);
    res.redirect("/userimport");
  } catch (err) {
    console.error("Erro ao processar CSV:", err.message);
    req.flash("error", "Erro ao processar arquivo CSV.");
    res.redirect("/userimport");
  }
};

export default {
  register,
  loginPost,
  login,
  create,
  findAll,
  findById,
  update,
  importForm,
  importCsv,
};
