import roundService from "../services/roundUser.service.js";
import path from "path";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { awardPoints } from "../services/gamification.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createRound = async (req, res) => {
  let hvThreshold = 200;
  try {
    const Settings = (await import("../models/Settings.js")).default;
    const cfg = await Settings.findOne({ key: "costs" }).lean();
    if (cfg && typeof cfg.highVolumeThreshold === 'number') hvThreshold = cfg.highVolumeThreshold;
  } catch (_e) {}
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
    const created = typeof result?.created === 'number' ? result.created : 0;
    const ignored = typeof result?.ignored === 'number' ? result.ignored : 0;
    const baseMsg = result?.message || "Round criado com sucesso.";
    req.flash("success", `${baseMsg} (${created} criados, ${ignored} já existentes)`);
    // Award XP to admin/teacher who created
    if (req.user && (req.user.role === 'admin' || req.user.role === 'teacher')) {
      try { await awardPoints(req.user.id, 20, 'create_round'); } catch(_e){}
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
    // Carrega custos configurados
    let costs = { shelterCost: 0, maleNeuterCost: 0, femaleNeuterCost: 0 };
    try {
      const Settings = (await import("../models/Settings.js")).default;
      const cfg = await Settings.findOne({ key: "costs" }).lean();
      if (cfg) {
        costs = {
          shelterCost: Number(cfg.shelterCost || 0),
          maleNeuterCost: Number(cfg.maleNeuterCost || 0),
          femaleNeuterCost: Number(cfg.femaleNeuterCost || 0),
        };
      }
    } catch (_e) {}
    const round = await roundService.findActiveRoundByUserCode(userCode);

    if (!round) {
      req.flash("error", "Nenhum round disponível para você no momento.");
      return res.render("round/management", {
        round: null,
        messages: req.flash("error"),
        success: req.flash("success"),
        costs,
      });
    }

    return res.render("round/management", {
      round,
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
    const updated = await roundService.updateService(
      id,
      undefined, // numberRound
      undefined, // codeUser
      undefined, // semester
      Number(quantMales),
      Number(quantFemales),
      Number(shelter),
      undefined // status
    );

    if (!updated) {
      req.flash("error", "Round não encontrado ou não pôde ser atualizado.");
      return res.redirect("/rounds");
    }

    req.flash("success", "Dados do round atualizados com sucesso!");
    // Award XP to the actor (student) once per update action
    if (req.user) { try { await awardPoints(req.user.id, 15, 'update_round'); } catch(_e){} }
    return res.redirect("/rounds");
  } catch (error) {
    console.error("Erro ao atualizar round:", error);
    req.flash("error", "Erro interno ao salvar os dados do round.");
    return res.redirect("/rounds");
  }
};

const closeRound = async (req, res) => {
  const { semester, numberRound } = req.body;

  if (!semester || !numberRound) {
    req.flash("error", "Campos 'semester' e 'numberRound' são obrigatórios.");
    return res.redirect("/roundclose");
  }

  try {
    await roundService.closeRoundForSemester(semester, numberRound);

    const rounds = await roundService.findBySemesterAndNumber(
      Number(semester),
      Number(numberRound)
    );

    const results = [];
    let pythonFailed = false;

    for (const round of rounds) {
      const dados = {
        [new Date().toISOString().split("T")[0]]: {
          f: round.quantFemales,
          m: round.quantMales,
        },
      };

      const scriptPath = path.resolve(__dirname, "../../script.py");
      const args = [
        "--quant",
        "4",
        "--dataini",
        "2024-07-01",
        "--dados",
        JSON.stringify(dados),
      ];

      console.log(`Executando: python ${scriptPath} ${args.join(" ")}`);

      await new Promise((resolve) => {
        execFile("python", [scriptPath, ...args], (error, stdout) => {
          if (error) {
            pythonFailed = true;
            return resolve();
          }

          if (!stdout) {
            pythonFailed = true;
            return resolve();
          }

          try {
            const parsed = JSON.parse(stdout);
            results.push({
              codeUser: round.codeUser,
              nameusr: round.nameusr || "Desconhecido",
              numberRound,
              semester,
              data: parsed,
            });
          } catch (_err) {
            pythonFailed = true;
          }
          return resolve();
        });
      });
    }

    const warning = pythonFailed
      ? "Dependências Python/numpy ausentes. Exibindo a página sem gráficos."
      : null;

    if (pythonFailed && results.length === 0) {
      req.flash("error", warning);
      return res.redirect("/roundclose");
    }

    // Award XP to admin/teacher who closed the round
    if (req.user && (req.user.role === 'admin' || req.user.role === 'teacher')) {
      try { await awardPoints(req.user.id, 30, 'close_round'); } catch(_e){}
    }

    res.render("round/graph", {
      results,
      numberRound,
      semester,
      warning,
    });
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
      const Round = (await import("../models/RoundUser.js")).default;
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
      const Round = (await import("../models/RoundUser.js")).default;
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
      res
        .status(500)
        .json({ message: "Erro ao listar rounds", error: e?.message || String(e) });
    }
  },
  async semesterUsersCount(req, res) {
    try {
      const semester = Number(req.query.semester);
      if (!Number.isFinite(semester)) {
        return res.status(400).json({ message: "Semestre inválido" });
      }
      const User = (await import("../models/User.js")).default;
      const activeUsers = await User.countDocuments({ semester, status: true });
      res.json({ activeUsers });
    } catch (e) {
      res
        .status(500)
        .json({ message: "Erro ao contar usuários ativos", error: e?.message || String(e) });
    }
  },
  async roundsAdminView(req, res) {
    try {
      const Round = (await import("../models/RoundUser.js")).default;
      const semester = Number(req.query.semester);
      const numberRound = req.query.numberRound !== undefined ? Number(req.query.numberRound) : undefined;
      const statusParam = typeof req.query.status === 'string' ? req.query.status : '';
      let list = [];
      let existing = [];
      if (Number.isFinite(semester)) {
        const filter = { semester };
        existing = await Round.distinct("numberRound", { semester });
        if (Number.isFinite(numberRound)) filter.numberRound = numberRound;
        if (statusParam === 'active') filter.status = true;
        if (statusParam === 'closed') filter.status = false;
        list = await Round.find(filter).sort({ numberRound: 1, codeUser: 1 }).lean();
      }
      res.render("round/admin", {
        semester: Number.isFinite(semester) ? semester : "",
        numberRound: Number.isFinite(numberRound) ? numberRound : "",
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
      const Round = (await import("../models/RoundUser.js")).default;
      const semester = Number(req.query.semester);
      const numberRound = req.query.numberRound !== undefined && req.query.numberRound !== '' ? Number(req.query.numberRound) : undefined;
      const statusParam = typeof req.query.status === 'string' ? req.query.status : '';
      if (!Number.isFinite(semester)) {
        return res.status(400).send("Parâmetro 'semester' é obrigatório");
      }
      const filter = { semester };
      if (Number.isFinite(numberRound)) filter.numberRound = numberRound;
      if (statusParam === 'active') filter.status = true;
      if (statusParam === 'closed') filter.status = false;
      const rows = await Round.find(filter).sort({ numberRound: 1, codeUser: 1 }).lean();

      const headers = [
        'semester','numberRound','codeUser','nameusr','quantMales','quantFemales','shelter','status','createdAt','updatedAt'
      ];
      const csv = [headers.join(',')].concat(
        rows.map(r => [
          r.semester,
          r.numberRound,
          r.codeUser,
          (r.nameusr||'').toString().replace(/"/g,'""'),
          r.quantMales,
          r.quantFemales,
          r.shelter,
          r.status ? 'true' : 'false',
          r.createdAt ? new Date(r.createdAt).toISOString() : '',
          r.updatedAt ? new Date(r.updatedAt).toISOString() : '',
        ].map(v => {
          const s = (v===undefined || v===null) ? '' : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
        }).join(','))
      ).join('\n');

      const fname = `rounds_sem_${semester}_n_${Number.isFinite(numberRound)?numberRound:'all'}_status_${statusParam||'all'}.csv`;
      res.setHeader('Content-Type','text/csv; charset=utf-8');
      res.setHeader('Content-Disposition',`attachment; filename="${fname}"`);
      res.send(csv);
    } catch (e) {
      res.status(500).send('Erro ao exportar CSV');
    }
  },
  async bulkClose(req, res) {
    try {
      const semester = Number(req.body.semester);
      const numberRound = req.body.numberRound !== undefined && req.body.numberRound !== '' ? Number(req.body.numberRound) : undefined;
      if (!Number.isFinite(semester)) {
        req.flash('error','Semestre inválido');
        return res.redirect('/roundsadmin');
      }
      const Round = (await import("../models/RoundUser.js")).default;
      const filter = { semester, status: true };
      if (Number.isFinite(numberRound)) filter.numberRound = numberRound;
      const upd = await Round.updateMany(filter, { $set: { status: false, updatedAt: new Date() } });
      // Log de auditoria
      try {
        const BulkActionLog = (await import("../models/BulkActionLog.js")).default;
        await BulkActionLog.create({
          user: req.user.id,
          action: 'bulk_close',
          semester,
          numberRound: Number.isFinite(numberRound) ? numberRound : undefined,
          statusFilter: 'active',
          affectedCount: upd.modifiedCount || 0,
        });
      } catch(_e) {}
      req.flash('success', `Fechou ${upd.modifiedCount||0} round(s) do filtro.`);
      const q = new URLSearchParams({ semester: String(semester), numberRound: Number.isFinite(numberRound)? String(numberRound): '' }).toString();
      return res.redirect(`/roundsadmin?${q}`);
    } catch (e) {
      req.flash('error','Erro ao fechar rounds do filtro.');
      return res.redirect('/roundsadmin');
    }
  },
  async bulkReopen(req, res) {
    try {
      const semester = Number(req.body.semester);
      const numberRound = req.body.numberRound !== undefined && req.body.numberRound !== '' ? Number(req.body.numberRound) : undefined;
      if (!Number.isFinite(semester)) {
        req.flash('error','Semestre inválido');
        return res.redirect('/roundsadmin');
      }
      const Round = (await import("../models/RoundUser.js")).default;
      const filter = { semester, status: false };
      if (Number.isFinite(numberRound)) filter.numberRound = numberRound;
      const upd = await Round.updateMany(filter, { $set: { status: true, updatedAt: new Date() } });
      // Log de auditoria
      try {
        const BulkActionLog = (await import("../models/BulkActionLog.js")).default;
        await BulkActionLog.create({
          user: req.user.id,
          action: 'bulk_reopen',
          semester,
          numberRound: Number.isFinite(numberRound) ? numberRound : undefined,
          statusFilter: 'closed',
          affectedCount: upd.modifiedCount || 0,
        });
      } catch(_e) {}
      req.flash('success', `Reabriu ${upd.modifiedCount||0} round(s) do filtro.`);
      const q = new URLSearchParams({ semester: String(semester), numberRound: Number.isFinite(numberRound)? String(numberRound): '' }).toString();
      return res.redirect(`/roundsadmin?${q}`);
    } catch (e) {
      req.flash('error','Erro ao reabrir rounds do filtro.');
      return res.redirect('/roundsadmin');
    }
  },
  async bulkDelete(req, res) {
    try {
      const semester = Number(req.body.semester);
      const numberRound = req.body.numberRound !== undefined && req.body.numberRound !== '' ? Number(req.body.numberRound) : undefined;
      const statusParam = typeof req.body.status === 'string' ? req.body.status : '';
      if (!Number.isFinite(semester)) {
        req.flash('error','Semestre inválido');
        return res.redirect('/roundsadmin');
      }
      const Round = (await import("../models/RoundUser.js")).default;
      const filter = { semester };
      if (Number.isFinite(numberRound)) filter.numberRound = numberRound;
      if (statusParam === 'active') filter.status = true;
      if (statusParam === 'closed') filter.status = false;
      const del = await Round.deleteMany(filter);
      // Log de auditoria
      try {
        const BulkActionLog = (await import("../models/BulkActionLog.js")).default;
        await BulkActionLog.create({
          user: req.user.id,
          action: 'bulk_delete',
          semester,
          numberRound: Number.isFinite(numberRound) ? numberRound : undefined,
          statusFilter: statusParam || '',
          affectedCount: del.deletedCount || 0,
        });
      } catch(_e) {}
      req.flash('success', `Excluiu ${del.deletedCount||0} round(s) do filtro.`);
      const q = new URLSearchParams({
        semester: String(semester),
        numberRound: Number.isFinite(numberRound)? String(numberRound): '',
        status: statusParam || ''
      }).toString();
      return res.redirect(`/roundsadmin?${q}`);
    } catch (e) {
      req.flash('error','Erro ao excluir rounds do filtro.');
      return res.redirect('/roundsadmin');
    }
  },
  async countFiltered(req, res) {
    try {
      const Round = (await import("../models/RoundUser.js")).default;
      const semester = Number(req.query.semester);
      const numberRound = req.query.numberRound !== undefined && req.query.numberRound !== '' ? Number(req.query.numberRound) : undefined;
      const statusParam = typeof req.query.status === 'string' ? req.query.status : '';
      if (!Number.isFinite(semester)) return res.status(400).json({ message: "Semestre inválido" });
      const filter = { semester };
      if (Number.isFinite(numberRound)) filter.numberRound = numberRound;
      if (statusParam === 'active') filter.status = true;
      if (statusParam === 'closed') filter.status = false;
      const count = await Round.countDocuments(filter);
      return res.json({ count });
    } catch (e) {
      return res.status(500).json({ message: 'Erro ao contar registros', error: e?.message || String(e) });
    }
  },
};
