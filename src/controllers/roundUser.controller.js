import roundService from "../services/roundUser.service.js";

const create = async (req, res) => {
  const { numberRound, semester } = req.body;

  if (numberRound === undefined || semester === undefined) {
    return res
      .status(400)
      .json({ message: "Campos 'numberRound' e 'semester' são obrigatórios." });
  }

  try {
    const result = await roundService.createRoundsForSemester(
      numberRound,
      semester
    );
    return res.status(201).json(result);
  } catch (error) {
    console.error("Erro ao criar rounds:", error);
    return res.status(500).json({ message: "Erro ao criar rounds.", error });
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


export default { create, findAll, findById, update, closeRound };
