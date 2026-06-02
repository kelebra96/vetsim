import userService from "../services/user.service.js";
import ExcelJS from "exceljs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../middlewares/auth.middleware.js";

const register = async (req, res) => {
  res.render("authenticate/register", { messages: req.flash("error"), success: req.flash("success") });
};

const loginPost = async (req, res) => {
  const { email, password } = req.body;

  const normalize = (v) => (v || "").toString().trim();
  const emailInput = normalize(email).toLowerCase();

  try {
    // busca case-insensitive para cobrir registros antigos
    const escaped = emailInput.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const user = await User.findOne({ email: { $regex: `^${escaped}$`, $options: "i" } }).select("+password");

    if (!user) {
      req.flash("error", "Usuário não encontrado.");
      return res.redirect("/");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      req.flash("error", "Senha inválida.");
      return res.redirect("/");
    }

    const token = generateToken({ id: user._id, code: user.code, role: user.type });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 3 * 60 * 60 * 1000,
    });
    res.redirect("/home");
  } catch (err) {
    req.flash("error", "Erro ao efetuar login.");
    return res.redirect("/");
  }
};

const login = async (req, res) => {
  res.render("authenticate/login", { messages: req.flash("error") });
};

const create = async (req, res) => {
  const { name, code, email, semester, password } = req.body;
  if (!name || !code || !email || !semester || !password) {
    req.flash("error", "Preencha todos os campos obrigatórios.");
    return res.redirect("/");
  }

  try {
    const user = await userService.createService({ name, code, email, semester, password, type: "student" });
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
      return res.status(200).send([]);
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
      return res.status(400).send({ message: "Submit at least one field for update" });
    }
    const { id } = req.params || {};
    await userService.updateService(id, name, code, email, semester, password, status);
    res.send({ message: "User successfully updated!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const importForm = async (req, res) => {
  res.render("user/import", { messages: req.flash("error"), success: req.flash("success") });
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
      headers.forEach((h, idx) => { data[h] = values[idx]; });

      if (data.semester) data.semester = Number(data.semester);
      if (data.code) data.code = Number(data.code);
      if (data.status !== undefined) data.status = data.status.toLowerCase() === "true" || data.status === "1";

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

const listView = async (req, res) => {
  try {
    const users = await User.find().select("name code email semester type status avatarUrl").sort({ name: 1 }).lean();
    res.render("user/list", {
      users,
      messages: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (err) {
    req.flash("error", "Erro ao carregar usuários.");
    res.redirect("/home");
  }
};

const profileView = async (req, res) => {
  try {
    const u = await User.findById(req.user.id).select("name email avatarUrl type code semester balance").lean();
    res.render("user/profile", { userDoc: u, messages: req.flash("error"), success: req.flash("success") });
  } catch (err) {
    req.flash("error", "Erro ao carregar perfil.");
    res.redirect("/home");
  }
};

const profileUpdate = async (req, res) => {
  try {
    let name = (req.body.name || "").toString().trim();
    // Saneamento simples: normaliza espaços e limita tamanho
    name = name.replace(/\s+/g, " ").slice(0, 80);
    const update = {};
    if (name && name.length >= 2) update.name = name;
    if (req.file && req.file.filename) {
      update.avatarUrl = "/uploads/avatars/" + req.file.filename;
    }
    if (Object.keys(update).length === 0) {
      req.flash("error", "Informe um nome ou selecione uma imagem.");
      return res.redirect("/profile");
    }
    await User.findByIdAndUpdate(req.user.id, { $set: update, updatedAt: new Date() });
    req.flash("success", "Perfil atualizado com sucesso.");
    res.redirect("/profile");
  } catch (err) {
    req.flash("error", "Erro ao atualizar perfil.");
    res.redirect("/profile");
  }
};

// Render edit page for a specific user (admin/teacher)
const editView = async (req, res) => {
  try {
    const u = await User.findById(req.params.id).lean();
    if (!u) { req.flash('error', 'Usuário não encontrado.'); return res.redirect('/users'); }
    res.render('user/edit', { u, messages: req.flash('error'), success: req.flash('success') });
  } catch (err) {
    req.flash('error', 'Erro ao carregar usuário.');
    return res.redirect('/users');
  }
};

// Update user fields (admin/teacher)
const adminUpdate = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, code, email, semester, type, status } = req.body;
    const update = {};
    if (typeof name === 'string' && name.trim().length >= 2) update.name = name.trim().slice(0, 80);
    const parsedCode = Number(code);
    if (code !== undefined && code !== '' && Number.isFinite(parsedCode) && parsedCode > 0) update.code = parsedCode;
    if (typeof email === 'string' && email.trim()) update.email = email.trim().toLowerCase();
    if (semester !== undefined && semester !== '') update.semester = Number(semester);
    if (type && ['student','teacher','admin'].includes(type)) update.type = type;
    if (typeof status !== 'undefined') update.status = (status === '1' || status === 'true' || status === true);
    update.updatedAt = new Date();
    await User.findByIdAndUpdate(id, { $set: update });
    req.flash('success', 'Usuário atualizado com sucesso.');
    res.redirect('/users');
  } catch (err) {
    req.flash('error', 'Erro ao atualizar usuário.');
    res.redirect('/users');
  }
};

// Toggle active/inactive status (admin/teacher)
const toggleStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const u = await User.findById(id).select('status').lean();
    if (!u) { req.flash('error', 'Usuário não encontrado.'); return res.redirect('/users'); }
    const next = !Boolean(u.status);
    await User.findByIdAndUpdate(id, { $set: { status: next, updatedAt: new Date() } });
    req.flash('success', next ? 'Usuário ativado.' : 'Usuário desativado.');
    res.redirect('/users');
  } catch (err) {
    req.flash('error', 'Erro ao alternar status.');
    res.redirect('/users');
  }
};

// Ajusta saldo VIDA (admin/professor): action add|remove, amount decimal >= 0
const adjustBalance = async (req, res) => {
  try {
    const id = req.params.id;
    const action = (req.body.action || '').toString();
    const raw = (req.body.amount || '').toString();
    const amount = Number(parseFloat(raw.replace(/[^0-9.,-]/g,'').replace(/\./g,'').replace(',', '.')));
    if (!Number.isFinite(amount) || amount < 0) {
      req.flash('error', 'Informe um valor válido (maior ou igual a zero).');
      return res.redirect('/users/edit/' + id);
    }
    const u = await User.findById(id).select('balance').lean();
    if (!u) {
      req.flash('error', 'Usuário não encontrado.');
      return res.redirect('/users');
    }
    let next = Number.isFinite(Number(u.balance)) ? Number(u.balance) : 50000;
    if (action === 'add') next = next + amount;
    else if (action === 'remove') next = Math.max(0, next - amount);
    else {
      req.flash('error', 'Ação inválida.');
      return res.redirect('/users/edit/' + id);
    }
    await User.findByIdAndUpdate(id, { $set: { balance: next, updatedAt: new Date() } });
    req.flash('success', `Saldo atualizado: ${next.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}`);
    res.redirect('/users/edit/' + id);
  } catch (err) {
    req.flash('error', 'Erro ao ajustar saldo.');
    res.redirect('/users');
  }
};

// Reset user password (admin/teacher)
const resetPassword = async (req, res) => {
  try {
    const id = req.params.id;
    const { password, confirm } = req.body;
    if (!password || password.length < 6) {
      req.flash('error', 'Senha deve ter ao menos 6 caracteres.');
      return res.redirect('/users/edit/' + id);
    }
    if (password !== confirm) {
      req.flash('error', 'As senhas não conferem.');
      return res.redirect('/users/edit/' + id);
    }
    const hash = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(id, { $set: { password: hash, updatedAt: new Date() } });
    req.flash('success', 'Senha redefinida com sucesso.');
    res.redirect('/users/edit/' + id);
  } catch (err) {
    req.flash('error', 'Erro ao redefinir senha.');
    res.redirect('/users');
  }
};

// Bulk activate/deactivate users
const bulkStatus = async (req, res) => {
  try {
    const { action, ids } = req.body;
    const list = Array.isArray(ids) ? ids : (ids ? [ids] : []);
    if (!list.length) { req.flash('error', 'Nenhum usuário selecionado.'); return res.redirect('/users'); }
    let status;
    if (action === 'activate') status = true; else if (action === 'deactivate') status = false; else {
      req.flash('error', 'Ação inválida.'); return res.redirect('/users');
    }
    await User.updateMany({ _id: { $in: list } }, { $set: { status, updatedAt: new Date() } });
    req.flash('success', `${status ? 'Ativados' : 'Desativados'} ${list.length} usuário(s).`);
    res.redirect('/users');
  } catch (err) {
    req.flash('error', 'Erro na ação em massa.');
    res.redirect('/users');
  }
};

export default { register, loginPost, login, create, findAll, findById, update, importForm, importCsv, listView, editView, adminUpdate, toggleStatus, resetPassword, bulkStatus, adjustBalance, profileView, profileUpdate };

// New: import students from CSV/XLSX (teacher/admin)
export async function importStudents(req, res) {
  if (!req.file) {
    req.flash("error", "Nenhum arquivo enviado.");
    return res.redirect("/register");
  }

  try {
    const buf = req.file.buffer;
    const filename = (req.file.originalname || '').toLowerCase();

    const normalize = (s) => (s || '').toString().trim();
    const normKey = (h) => normalize(h)
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu,'') // remove acentos
      .replace(/[^a-z0-9]+/g,'')
    ;
    const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

    const rows = [];
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buf);
      const worksheet = workbook.worksheets[0];
      const headers = [];
      worksheet.getRow(1).eachCell((cell, colNum) => {
        headers[colNum] = (cell.value || '').toString().trim();
      });
      worksheet.eachRow((row, rowNum) => {
        if (rowNum === 1) return;
        const obj = {};
        row.eachCell((cell, colNum) => {
          if (headers[colNum]) {
            const v = cell.value;
            obj[headers[colNum]] = (v !== null && v !== undefined) ? String(v).trim() : '';
          }
        });
        if (Object.keys(obj).length > 0) rows.push(obj);
      });
    } else {
      // CSV fallback (comma-separated)
      const csv = buf.toString('utf-8');
      const lines = csv.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        req.flash("error", "Arquivo vazio ou inválido.");
        return res.redirect("/register");
      }
      const headers = lines[0].split(',').map(h => h.trim());
      for (const line of lines.slice(1)) {
        const values = line.split(',').map(v => v.trim());
        if (!values.length) continue;
        const obj = {};
        headers.forEach((h, idx) => obj[h] = values[idx] ?? '');
        rows.push(obj);
      }
    }

    // Pre-map all rows to avoid N+1 DB queries for duplicate checking
    const mappedRows = [];
    const seenEmails = new Set();
    let skipped = 0, errors = 0;
    let skippedMissing = 0, skippedInvalidEmail = 0, skippedDupFile = 0, skippedDupDB = 0, skippedInvalidNum = 0;
    const details = [];

    for (const r of rows) {
      const mapped = {};
      for (const [k, v] of Object.entries(r)) {
        const key = normKey(k);
        if (['name','nome','aluno','nomealuno'].includes(key)) mapped.name = normalize(v);
        else if (['code','codigo','código','codigodoaluno','codigoaluno','codealuno','matricula'].includes(key)) mapped.code = v;
        else if (['email','e-mail','mail'].includes(key)) mapped.email = normalize(v).toLowerCase();
        else if (['semester','semestre'].includes(key)) mapped.semester = v;
        else if (['password','senha'].includes(key)) mapped.password = normalize(v);
        else if (['status','ativo'].includes(key)) mapped.status = v;
        else if (['type','tipo','tipousuario'].includes(key)) mapped.type = v;
      }
      const rawEmail = normalize(mapped.email || '').toLowerCase();
      mapped.email = rawEmail;
      mapped.code = Number(mapped.code);
      mapped.semester = Number(mapped.semester);
      if (mapped.status === undefined || mapped.status === '') mapped.status = true; else mapped.status = String(mapped.status).toLowerCase() === 'true' || mapped.status === 1 || mapped.status === '1';
      if (!mapped.type) mapped.type = 'student';

      const missing = (!mapped.name || !mapped.code || !mapped.email || !mapped.semester || !mapped.password);
      if (missing) { skipped++; skippedMissing++; details.push(`Linha com campos ausentes para email '${rawEmail || '-'}'`); continue; }
      if (!Number.isFinite(mapped.code) || mapped.code <= 0 || !Number.isFinite(mapped.semester) || mapped.semester < 1 || mapped.semester > 20) {
        skipped++; skippedInvalidNum++; details.push(`Linha inválida (code/semester) para email '${rawEmail}'`); continue; }
      if (!isValidEmail(rawEmail)) { skipped++; skippedInvalidEmail++; details.push(`Email inválido: '${rawEmail}'`); continue; }
      if (seenEmails.has(rawEmail)) { skipped++; skippedDupFile++; details.push(`Email duplicado no arquivo: '${rawEmail}'`); continue; }
      seenEmails.add(rawEmail);
      mappedRows.push(mapped);
    }

    // Single DB call to find all already-existing emails (replaces N individual findOne calls)
    const existingDocs = await User.find({ email: { $in: [...seenEmails] } }).select('email').lean();
    const existingEmailSet = new Set(existingDocs.map(d => d.email));

    let created = 0;
    for (const mapped of mappedRows) {
      if (existingEmailSet.has(mapped.email)) {
        skipped++; skippedDupDB++; details.push(`Email já cadastrado: '${mapped.email}'`); continue;
      }
      try {
        await userService.createService(mapped);
        created++;
      } catch (e) {
        errors++;
        details.push(`Erro ao criar '${mapped.email}': ${e?.message || e}`);
      }
    }

    const summary = `Criados: ${created} | Ignorados: ${skipped} (faltantes: ${skippedMissing}, email inválido: ${skippedInvalidEmail}, duplicado no arquivo: ${skippedDupFile}, duplicado no sistema: ${skippedDupDB}, num inválido: ${skippedInvalidNum}) | Erros: ${errors}`;
    if (created > 0) req.flash('success', summary);
    else req.flash('error', summary);
    if (details.length) {
      const head = details.slice(0, 10).join(' | ');
      req.flash('error', `Detalhes: ${head}${details.length>10 ? ' ...' : ''}`);
    }
    const hasIssues = details.length > 0 || created === 0;
    return res.redirect('/register' + (hasIssues ? '?import=1' : ''));
  } catch (err) {
    req.flash('error', 'Erro ao processar arquivo.');
    return res.redirect('/register');
  }
}
