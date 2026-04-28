import roundService from "../services/roundUser.service.js";
import Round from "../models/RoundUser.js";
import User from "../models/User.js";
import BulkActionLog from "../models/BulkActionLog.js";
import Settings from "../models/Settings.js";
import path from "path";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { awardPoints } from "../services/gamification.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Helpers ---

function parseRoundFilter({ semester, numberRound, status }) {
  const sem = Number(semester);
  const nr = (numberRound !== undefined && numberRound !== "") ? Number(numberRound) : undefined;
  const statusParam = typeof status === "string" ? status : "";
  return { sem, nr, statusParam };
}

function buildRoundFilter(sem, nr, statusParam) {
  const filter = { semester: sem };
  if (Number.isFinite(nr)) filter.numberRound = nr;
  if (statusParam === "active") filter.status = true;
  if (statusParam === "closed") filter.status = false;
  return filter;
}

function buildAdminRedirectUrl(sem, nr) {
  const params = new URLSearchParams({ semester: String(sem) });
  if (Number.isFinite(nr)) params.set("numberRound", String(nr));
  return `/roundsadmin?${params}`;
}

async function logBulkAction(userId, action, { semester, numberRound, statusFilter, affectedCount }) {
  try {
    await BulkActionLog.create({
      user: userId,
      action,
      semester,
      numberRound: Number.isFinite(numberRound) ? numberRound : undefined,
      statusFilter,
      affectedCount,
    });
  } catch (err) {
    console.warn("BulkActionLog.create failed:", err.message);
  }
}

async function loadCosts() {
  try {
    const cfg = await Settings.findOne({ key: "costs" }).lean();
    if (!cfg) return { shelterCost: 0, maleNeuterCost: 0, femaleNeuterCost: 0 };
    return {
      shelterCost: Number(cfg.shelterCost || 0),
      maleNeuterCost: Number(cfg.maleNeuterCost || 0),
      femaleNeuterCost: Number(cfg.femaleNeuterCost || 0),
    };
  } catch (err) {
    console.warn("Could not load Settings.costs, using defaults:", err.message);
    return { shelterCost: 0, maleNeuterCost: 0, femaleNeuterCost: 0 };
  }
}

function runSimulationScript(scriptPath, args) {
  const candidates = [process.env.PYTHON_BIN, "python3", "python"].filter(Boolean);

  return new Promise((resolve, reject) => {
    let idx = 0;
    const tryNext = (lastErr) => {
      if (idx >= candidates.length) {
        return reject(lastErr || new Error("Nenhum interpretador Python disponível."));
      }

      const cmd = candidates[idx++];
      execFile(cmd, [scriptPath, ...args], (error, stdout) => {
        if (error) {
          // Tenta próximo binário só quando o comando não existe.
          if (error.code === "ENOENT") return tryNext(error);
          return reject(error);
        }
        resolve(stdout);
      });
    };

    tryNext();
  });
}

function buildCastrationTimeline(roundHistory, fallbackDateKey) {
  const timeline = {};
  for (const h of roundHistory) {
    const dateBase = h.updatedAt || h.createdAt;
    const dateKey = dateBase
      ? new Date(dateBase).toISOString().split("T")[0]
      : fallbackDateKey;

    if (!timeline[dateKey]) timeline[dateKey] = { f: 0, m: 0 };
    timeline[dateKey].f += Number(h.quantFemales || 0);
    timeline[dateKey].m += Number(h.quantMales || 0);
  }
  return timeline;
}

function buildRoundTimeline(roundHistory) {
  const byRound = new Map();
  for (const row of roundHistory) {
    const r = Number(row.numberRound);
    if (!Number.isFinite(r)) continue;
    byRound.set(r, row);
  }

  const timeline = [];
  for (let r = 1; r <= 4; r += 1) {
    const row = byRound.get(r);
    if (!row) {
      timeline.push({ round: r, exists: false });
      continue;
    }
    timeline.push({
      round: r,
      exists: true,
      males: Number(row.quantMales || 0),
      females: Number(row.quantFemales || 0),
      total: Number(row.quantMales || 0) + Number(row.quantFemales || 0),
      shelter: Number(row.shelter || 0),
      status: row.status === false ? "closed" : "active",
      updatedAt: row.updatedAt || row.createdAt || null,
    });
  }

  return timeline;
}

// --- Controllers ---

const createRound = async (req, res) => {
  let hvThreshold = 200;
  try {
    const cfg = await Settings.findOne({ key: "costs" }).lean();
    if (cfg && typeof cfg.highVolumeThreshold === "number") hvThreshold = cfg.highVolumeThreshold;
  } catch (err) {
    console.warn("Could not load Settings for hvThreshold:", err.message);
  }
  res.render("round/create", {
    messages: req.flash("error"),
    success: req.flash("success"),
    hvThreshold,
  });
};

const create = async (req, res) => {
  const { numberRound, semester } = req.body;

  if (numberRound === undefined || semester === undefined) {
    req.flash("error", "Campos 'Número do Round' e 'Semestre' são obrigatórios.");
    return res.redirect("/roundcreate");
  }

  try {
    const result = await roundService.createRoundsForSemester(numberRound, semester);
    if (result && result.blocked) {
      req.flash("error", result.message || "Regra de criação de rounds violada.");
      return res.redirect("/roundcreate");
    }
    const created = typeof result?.created === "number" ? result.created : 0;
    const ignored = typeof result?.ignored === "number" ? result.ignored : 0;
    const baseMsg = result?.message || "Round criado com sucesso.";
    req.flash("success", `${baseMsg} (${created} criados, ${ignored} já existentes)`);
    if (req.user && (req.user.role === "admin" || req.user.role === "teacher")) {
      try { await awardPoints(req.user.id, 20, "create_round"); } catch (_e) {}
    }
    return res.redirect("/roundcreate");
  } catch (error) {
    console.error("Erro ao criar rounds:", error);
    req.flash("error", "Erro interno ao criar rounds.");
    return res.redirect("/roundcreate");
  }
};

const rounds = async (req, res) => {
  const userCode = req.user?.code;
  if (!userCode) {
    req.flash("error", "Sessão expirada. Faça login novamente.");
    return res.redirect("/");
  }

  try {
    const [costs, round] = await Promise.all([
      loadCosts(),
      roundService.findActiveRoundByUserCode(userCode),
    ]);

    return res.render("round/management", {
      round: round || null,
      messages: req.flash("error"),
      success: req.flash("success"),
      costs,
    });
  } catch (error) {
    console.error("Erro ao carregar round do usuário:", error);
    req.flash("error", "Erro interno ao carregar seu round.");
    return res.redirect("/home");
  }
};

const findAll = async (req, res) => {
  try {
    const rounds = await roundService.findAllService();
    res.json(rounds);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar rounds", error });
  }
};

const findById = async (req, res) => {
  try {
    const round = await roundService.findByIdService(req.params.id);
    if (!round) return res.status(404).json({ message: "Round não encontrado." });
    res.json(round);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar round", error });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { quantMales, quantFemales, shelter } = req.body;

  try {
    const updated = await roundService.updateService(id, {
      quantMales: Number(quantMales),
      quantFemales: Number(quantFemales),
      shelter: Number(shelter),
    });

    if (!updated) {
      req.flash("error", "Round não encontrado ou não pôde ser atualizado.");
      return res.redirect("/rounds");
    }

    req.flash("success", "Dados do round atualizados com sucesso!");
    if (req.user) { try { await awardPoints(req.user.id, 15, "update_round"); } catch (_e) {} }
    return res.redirect("/rounds");
  } catch (error) {
    console.error("Erro ao atualizar round:", error);
    req.flash("error", "Erro interno ao salvar os dados do round.");
    return res.redirect("/rounds");
  }
};

const closeRound = async (req, res) => {
  const { semester, numberRound } = req.body;
  const sem = Number(semester);
  const nr = Number(numberRound);

  if (!Number.isFinite(sem) || !Number.isFinite(nr) || sem < 1 || sem > 8 || nr < 1 || nr > 4) {
    req.flash("error", "Campos 'semester' e 'numberRound' são obrigatórios.");
    return res.redirect("/roundclose");
  }

  try {
    await roundService.closeRoundForSemester(sem, nr);

    const rounds = await roundService.findBySemesterAndNumber(sem, nr);
    const codes = rounds.map((r) => String(r.codeUser));
    const historyRows = await Round.find({
      semester: sem,
      codeUser: { $in: codes },
      numberRound: { $gte: 1, $lte: 4 },
    }).sort({ codeUser: 1, numberRound: 1, updatedAt: 1 }).lean();

    const historyByCode = new Map();
    for (const row of historyRows) {
      const key = String(row.codeUser);
      if (!historyByCode.has(key)) historyByCode.set(key, []);
      historyByCode.get(key).push(row);
    }

    const results = [];
    let pythonFailed = false;
    const scriptPath = path.resolve(__dirname, "../../script.py");
    const today = new Date().toISOString().split("T")[0];

    await Promise.all(
      rounds.map(
        (round) =>
          new Promise((resolve) => {
            const userHistoryAll = historyByCode.get(String(round.codeUser)) || [round];
            const userHistorySim = userHistoryAll.filter((h) => Number(h.numberRound) <= nr);
            const dados = buildCastrationTimeline(userHistorySim, today);
            const args = ["--quant", "4", "--dataini", "2024-07-01", "--dados", JSON.stringify(dados)];
            runSimulationScript(scriptPath, args)
              .then((stdout) => {
                if (!stdout) {
                  pythonFailed = true;
                  return;
                }
                const parsed = JSON.parse(stdout);
                if (!parsed || typeof parsed !== "object" || parsed.error) {
                  pythonFailed = true;
                  return;
                }
                const prev = userHistoryAll.find((h) => Number(h.numberRound) === nr - 1);
                const curTotal = Number(round.quantMales || 0) + Number(round.quantFemales || 0);
                const prevTotal = prev
                  ? Number(prev.quantMales || 0) + Number(prev.quantFemales || 0)
                  : 0;

                results.push({
                  codeUser: round.codeUser,
                  nameusr: round.nameusr || "Desconhecido",
                  numberRound: round.numberRound,
                  semester: round.semester,
                  compare: {
                    hasPrevious: Boolean(prev),
                    prevRound: prev ? prev.numberRound : null,
                    deltaMales: Number(round.quantMales || 0) - Number(prev?.quantMales || 0),
                    deltaFemales: Number(round.quantFemales || 0) - Number(prev?.quantFemales || 0),
                    deltaTotal: curTotal - prevTotal,
                  },
                  timeline: buildRoundTimeline(userHistoryAll),
                  data: parsed,
                });
              })
              .catch(() => {
                pythonFailed = true;
              })
              .finally(resolve);
          })
      )
    );

    const warning = pythonFailed
      ? "Não foi possível gerar todos os gráficos automaticamente. Exibindo resultados parciais."
      : null;

    if (pythonFailed && results.length === 0) {
      req.flash("error", "Não foi possível gerar os gráficos deste fechamento. Verifique a instalação do Python 3 no servidor.");
      return res.redirect("/roundclose");
    }

    if (req.user && (req.user.role === "admin" || req.user.role === "teacher")) {
      try { await awardPoints(req.user.id, 30, "close_round"); } catch (_e) {}
    }

    res.render("round/graph", { results, numberRound: nr, semester: sem, warning });
  } catch (error) {
    console.error("Erro ao fechar round:", error);
    req.flash("error", "Erro ao fechar o round.");
    res.redirect("/roundclose");
  }
};

const roundCloseForm = async (req, res) => {
  res.render("round/close", {
    messages: req.flash("error"),
    success: req.flash("success"),
  });
};

export default {
  createRound,
  create,
  rounds,
  findAll,
  findById,
  update,
  closeRound,
  roundCloseForm,

  async roundsExisting(req, res) {
    try {
      const semester = Number(req.query.semester);
      if (!Number.isFinite(semester)) {
        return res.status(400).json({ message: "Semestre inválido" });
      }
      const existing = await Round.distinct("numberRound", { semester });
      res.json({ existing });
    } catch (e) {
      res.status(500).json({ message: "Erro ao consultar rounds", error: e?.message || String(e) });
    }
  },

  async roundsList(req, res) {
    try {
      const semester = Number(req.query.semester);
      if (!Number.isFinite(semester)) {
        return res.status(400).json({ message: "Semestre inválido" });
      }
      const data = await Round.aggregate([
        { $match: { semester } },
        {
          $group: {
            _id: "$numberRound",
            count: { $sum: 1 },
            lastUpdated: { $max: "$updatedAt" },
            firstCreated: { $min: "$createdAt" },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      const list = data.map((d) => ({
        numberRound: d._id,
        count: d.count,
        lastUpdated: d.lastUpdated,
        firstCreated: d.firstCreated,
      }));
      res.json({ list });
    } catch (e) {
      res.status(500).json({ message: "Erro ao listar rounds", error: e?.message || String(e) });
    }
  },

  async semesterUsersCount(req, res) {
    try {
      const semester = Number(req.query.semester);
      if (!Number.isFinite(semester)) {
        return res.status(400).json({ message: "Semestre inválido" });
      }
      const activeUsers = await User.countDocuments({ semester, status: true });
      res.json({ activeUsers });
    } catch (e) {
      res.status(500).json({ message: "Erro ao contar usuários ativos", error: e?.message || String(e) });
    }
  },

  async roundsAdminView(req, res) {
    try {
      const { sem, nr, statusParam } = parseRoundFilter(req.query);
      let list = [];
      let existing = [];
      if (Number.isFinite(sem)) {
        const filter = buildRoundFilter(sem, nr, statusParam);
        [existing, list] = await Promise.all([
          Round.distinct("numberRound", { semester: sem }),
          Round.find(filter).sort({ numberRound: 1, codeUser: 1 }).lean(),
        ]);
      }
      res.render("round/admin", {
        semester: Number.isFinite(sem) ? sem : "",
        numberRound: Number.isFinite(nr) ? nr : "",
        statusParam,
        existing,
        list,
        messages: req.flash("error"),
        success: req.flash("success"),
      });
    } catch (e) {
      req.flash("error", "Erro ao carregar administração de rounds.");
      return res.redirect("/home");
    }
  },

  async exportCsv(req, res) {
    try {
      const { sem, nr, statusParam } = parseRoundFilter(req.query);
      if (!Number.isFinite(sem)) {
        return res.status(400).send("Parâmetro 'semester' é obrigatório");
      }
      const filter = buildRoundFilter(sem, nr, statusParam);
      const headers = ["semester", "numberRound", "codeUser", "nameusr", "quantMales", "quantFemales", "shelter", "status", "createdAt", "updatedAt"];
      const fname = `rounds_sem_${sem}_n_${Number.isFinite(nr) ? nr : "all"}_status_${statusParam || "all"}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
      res.write(headers.join(",") + "\n");

      const cursor = Round.find(filter).sort({ numberRound: 1, codeUser: 1 }).lean().cursor();
      for await (const r of cursor) {
        const row = [
          r.semester, r.numberRound, r.codeUser,
          (r.nameusr || "").toString().replace(/"/g, '""'),
          r.quantMales, r.quantFemales, r.shelter,
          r.status ? "true" : "false",
          r.createdAt ? new Date(r.createdAt).toISOString() : "",
          r.updatedAt ? new Date(r.updatedAt).toISOString() : "",
        ].map((v) => {
          const s = (v === undefined || v === null) ? "" : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(",");
        res.write(row + "\n");
      }
      res.end();
    } catch (e) {
      res.status(500).send("Erro ao exportar CSV");
    }
  },

  async bulkClose(req, res) {
    try {
      const { sem, nr } = parseRoundFilter(req.body);
      if (!Number.isFinite(sem)) {
        req.flash("error", "Semestre inválido");
        return res.redirect("/roundsadmin");
      }
      const filter = { semester: sem, status: true };
      if (Number.isFinite(nr)) filter.numberRound = nr;
      const upd = await Round.updateMany(filter, { $set: { status: false, updatedAt: new Date() } });
      logBulkAction(req.user.id, "bulk_close", { semester: sem, numberRound: nr, statusFilter: "active", affectedCount: upd.modifiedCount || 0 });
      req.flash("success", `Fechou ${upd.modifiedCount || 0} round(s) do filtro.`);
      return res.redirect(buildAdminRedirectUrl(sem, nr));
    } catch (e) {
      req.flash("error", "Erro ao fechar rounds do filtro.");
      return res.redirect("/roundsadmin");
    }
  },

  async bulkReopen(req, res) {
    try {
      const { sem, nr } = parseRoundFilter(req.body);
      if (!Number.isFinite(sem)) {
        req.flash("error", "Semestre inválido");
        return res.redirect("/roundsadmin");
      }
      const filter = { semester: sem, status: false };
      if (Number.isFinite(nr)) filter.numberRound = nr;
      const upd = await Round.updateMany(filter, { $set: { status: true, updatedAt: new Date() } });
      logBulkAction(req.user.id, "bulk_reopen", { semester: sem, numberRound: nr, statusFilter: "closed", affectedCount: upd.modifiedCount || 0 });
      req.flash("success", `Reabriu ${upd.modifiedCount || 0} round(s) do filtro.`);
      return res.redirect(buildAdminRedirectUrl(sem, nr));
    } catch (e) {
      req.flash("error", "Erro ao reabrir rounds do filtro.");
      return res.redirect("/roundsadmin");
    }
  },

  async bulkDelete(req, res) {
    try {
      const { sem, nr, statusParam } = parseRoundFilter(req.body);
      if (!Number.isFinite(sem)) {
        req.flash("error", "Semestre inválido");
        return res.redirect("/roundsadmin");
      }
      const filter = buildRoundFilter(sem, nr, statusParam);
      const del = await Round.deleteMany(filter);
      logBulkAction(req.user.id, "bulk_delete", { semester: sem, numberRound: nr, statusFilter: statusParam || "", affectedCount: del.deletedCount || 0 });
      req.flash("success", `Excluiu ${del.deletedCount || 0} round(s) do filtro.`);
      const params = new URLSearchParams({ semester: String(sem) });
      if (Number.isFinite(nr)) params.set("numberRound", String(nr));
      if (statusParam) params.set("status", statusParam);
      return res.redirect(`/roundsadmin?${params}`);
    } catch (e) {
      req.flash("error", "Erro ao excluir rounds do filtro.");
      return res.redirect("/roundsadmin");
    }
  },

  async countFiltered(req, res) {
    try {
      const { sem, nr, statusParam } = parseRoundFilter(req.query);
      if (!Number.isFinite(sem)) return res.status(400).json({ message: "Semestre inválido" });
      const filter = buildRoundFilter(sem, nr, statusParam);
      const count = await Round.countDocuments(filter);
      return res.json({ count });
    } catch (e) {
      return res.status(500).json({ message: "Erro ao contar registros", error: e?.message || String(e) });
    }
  },
};
