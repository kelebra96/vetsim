import Round from "../models/RoundUser.js";
import User from "../models/User.js";

const createRoundsForSemester = async (numberRound, semester) => {
  const nr = Number(numberRound);
  const sem = Number(semester);

  if (!Number.isFinite(nr) || !Number.isFinite(sem)) {
    return { message: "Número do round ou semestre inválido.", created: 0, blocked: true };
  }
  if (nr < 1 || nr > 4) {
    return { message: "Só é permitido criar rounds de 1 a 4 por semestre.", created: 0, blocked: true };
  }

  // Regra: máximo 4 rounds distintos por semestre
  const existingNumbers = await Round.distinct("numberRound", { semester: sem });
  const alreadyExists = existingNumbers.includes(nr);
  if (!alreadyExists && existingNumbers.length >= 4) {
    return { message: "Limite de 4 rounds por semestre já atingido.", created: 0, blocked: true };
  }

  const users = await User.find({ semester: sem, status: true });

  if (!users.length) {
    return { message: "Nenhum usuário ativo encontrado para o semestre informado.", created: 0, blocked: true };
  }

  const bulkOperations = [];
  for (const user of users) {
    bulkOperations.push({
      updateOne: {
        filter: { codeUser: String(user.code), numberRound: nr, semester: sem },
        update: {
          $setOnInsert: {
            numberRound: nr,
            nameusr: user.name,
            codeUser: String(user.code),
            semester: sem,
            quantMales: 0,
            quantFemales: 0,
            shelter: 0,
            status: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    });
  }

  const result = await Round.bulkWrite(bulkOperations, { ordered: false });
  const attempted = users.length;
  const created = Number(result.upsertedCount || 0);
  const ignored = Math.max(0, attempted - created);

  return {
    message: alreadyExists
      ? "Round já existente atualizado/criado para usuários do semestre."
      : "Rounds criados com sucesso (ou já existentes foram ignorados).",
    created,
    attempted,
    ignored,
    existingCount: Array.isArray(existingNumbers) ? existingNumbers.length : 0,
    blocked: false,
  };
};

const closeRoundForSemester = async (semester, numberRound) => {
  const result = await Round.updateMany(
    { semester, numberRound, status: true },
    { $set: { status: false, updatedAt: new Date() } }
  );
  return { message: "Round encerrado com sucesso.", modifiedCount: result.modifiedCount };
};

const findActiveRoundByUserCode = async (codeUser) => {
  return Round.findOne({ codeUser: String(codeUser), status: true });
};

const findBySemesterAndNumber = (semester, numberRound) => Round.find({ semester, numberRound });

const createService = (body) => Round.create(body);
const findAllService = () => Round.find();
const findByIdService = (id) => Round.findById(id);

const updateService = (
  id,
  numberRound,
  codeUser,
  semester,
  quantMales,
  quantFemales,
  shelter,
  status
) => {
  const update = {};
  if (numberRound !== undefined) update.numberRound = numberRound;
  if (codeUser !== undefined) update.codeUser = codeUser;
  if (semester !== undefined) update.semester = semester;
  if (quantMales !== undefined) update.quantMales = quantMales;
  if (quantFemales !== undefined) update.quantFemales = quantFemales;
  if (shelter !== undefined) update.shelter = shelter;
  if (status !== undefined) update.status = status;
  update.updatedAt = new Date();

  return Round.findOneAndUpdate({ _id: id }, update, { new: true });
};

export default {
  createService,
  findAllService,
  findByIdService,
  updateService,
  createRoundsForSemester,
  closeRoundForSemester,
  findActiveRoundByUserCode,
  findBySemesterAndNumber,
};
