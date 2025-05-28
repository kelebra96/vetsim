import roundService from "../services/roundUser.service.js";
import path from "path";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const createRound = async (req, res) => {
  res.render("round/create", {
    messages: req.flash("error"),
    success: req.flash("success"),
  });
};

const create = async (req, res) => {
  const { numberRound, semester } = req.body;

  if (numberRound === undefined || semester === undefined) {
    req.flash(
      "error",
      "Campos 'Número do Round' e 'Semestre' são obrigatórios."
    );
    return res.redirect("/roundcreate");
  }

  try {
    const result = await roundService.createRoundsForSemester(
      numberRound,
      semester
    );
    req.flash("success", result.message || "Round criado com sucesso.");
    return res.redirect("/roundcreate");
  } catch (error) {
    console.error("Erro ao criar rounds:", error);
    req.flash("error", "Erro interno ao criar rounds.");
    return res.redirect("/roundcreate");
  }
};

const rounds = async (req, res) => {
  const userCode = req.user?.code; // Obtém o código do usuário da sessão
  const nameusr = req.user?.name; // Obtém o nome do usuário da sessão

  if (!userCode) {
    req.flash("error", "Sessão expirada. Faça login novamente.");
    return res.redirect("/");
  }

  try {
    const round = await roundService.findActiveRoundByUserCode(userCode);

    if (!round) {
      req.flash("error", "Nenhum round disponível para você no momento.");
      return res.render("round/management", {
        round: null,
        messages: req.flash("error"),
        success: req.flash("success"),
      });
    }

    return res.render("round/management", {
      round,
      messages: req.flash("error"),
      success: req.flash("success"),
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
    if (!round)
      return res.status(404).json({ message: "Round não encontrado." });
    res.json(round);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar round", error });
  }
};

const update = async (req, res) => {
  const { id } = req.params;// Obtém o ID do round a ser atualizado
  const { quantMales, quantFemales, shelter } = req.body;

  try {
    const updated = await roundService.updateService(
      id,
      undefined, // número da rodada não será atualizado
      undefined, // nome do usuário não será atualizado
      undefined, // código do usuário também não
      undefined, // semestre também não
      Number(quantMales),
      Number(quantFemales),
      Number(shelter),
      undefined // status também não será alterado
    );

    if (!updated) {
      req.flash("error", "Round não encontrado ou não pôde ser atualizado.");
      return res.redirect("/rounds");
    }

    req.flash("success", "Dados do round atualizados com sucesso!");
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
    // 1. Encerra os rounds no banco
    await roundService.closeRoundForSemester(semester, numberRound);

    // 2. Busca todos os rounds desse semestre + número
    const rounds = await roundService.findBySemesterAndNumber(
      Number(semester),
      Number(numberRound)
    );

    // 3. Prepara as entradas para simulação por usuário
    const results = [];

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

      await new Promise((resolve, reject) => {
        execFile("python", [scriptPath, ...args], (error, stdout, stderr) => {
          if (error) {
            console.error("❌ Erro ao executar script Python:", error);
            return reject(error);
          }

          console.log("📤 STDOUT:", stdout);
          console.log("📥 STDERR:", stderr);

          try {
            const parsed = JSON.parse(stdout);
            results.push({
              codeUser: round.codeUser,
              numberRound,
              semester,
              data: parsed,
            });
            resolve();
          } catch (parseError) {
            console.error("❌ Erro ao fazer JSON.parse:", parseError.message);
            return reject(parseError);
          }
        });
      });
    }

    // 4. Renderiza uma view com todos os gráficos
    res.render("round/graph", {
      results,
      numberRound,
      semester,
    });
  } catch (error) {
    console.error("❌ Erro ao fechar round:", error);
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
};
