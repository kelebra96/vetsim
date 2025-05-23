import roundService from "../services/roundUser.service.js";

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
  const userCode = req.user?.code;

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
  const { id } = req.params;
  const {
    numberRound,
    codeUser,
    semester,
    quantMales,
    quantFemales,
    shelter,
    status,
  } = req.body;

  try {
    const updated = await roundService.updateService(
      id,
      numberRound,
      codeUser,
      semester,
      quantMales,
      quantFemales,
      shelter,
      status
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar round", error });
  }
};

const closeRound = async (req, res) => {
  const { semester, numberRound } = req.body;

  if (semester === undefined || numberRound === undefined) {
    return res
      .status(400)
      .json({ message: "Campos 'semester' e 'numberRound' são obrigatórios." });
  }

  try {
    const result = await roundService.closeRoundForSemester(
      semester,
      numberRound
    );
    return res.json(result);
  } catch (error) {
    console.error("Erro ao encerrar round:", error);
    res.status(500).json({ message: "Erro ao encerrar round.", error });
  }
};
export default { createRound, create, rounds, findAll, findById, update, closeRound };
