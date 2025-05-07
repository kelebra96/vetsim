import Round from "../models/RoundUser.js";
import User from "../models/User.js";

const createRoundsForSemester = async (numberRound, semester) => {
  const users = await User.find({ semester, status: true });

  if (!users.length) {
    return {
      message: "Nenhum usuário ativo encontrado para o semestre informado.",
      created: 0,
    };
  }

  const bulkOperations = [];

  for (const user of users) {
    bulkOperations.push({
      updateOne: {
        filter: { codeUser: user.code, numberRound, semester },
        update: {
          $setOnInsert: {
            numberRound,
            codeUser: user.code,
            semester,
            quantMales: 0,
            quantFemales: 0,
            shelter: 0,
            status: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        upsert: true, // ✅ cria somente se não existir
      },
    });
  }

  const result = await Round.bulkWrite(bulkOperations, { ordered: false });

  return {
    message: "Rounds criados com sucesso (ou já existentes foram ignorados).",
    created: result.upsertedCount,
  };
};

const closeRoundForSemester = async (semester, numberRound) => {
  const result = await Round.updateMany(
    { semester, numberRound, status: true },
    { $set: { status: false, updatedAt: new Date() } }
  );

  return {
    message: "Round encerrado com sucesso.",
    modifiedCount: result.modifiedCount,
  };
};


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
) =>
  Round.findOneAndUpdate(
    { _id: id },
    {
      numberRound,
      codeUser,
      semester,
      quantMales,
      quantFemales,
      shelter,
      status,
    },
    { new: true }
  );

export default {
  createService,
  findAllService,
  findByIdService,
  updateService,
  createRoundsForSemester,
  closeRoundForSemester,
};
