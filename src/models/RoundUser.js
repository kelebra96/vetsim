import mongoose from "mongoose";

const RoundSchema = new mongoose.Schema({
  numberRound: { type: Number, required: true },
  codeUser: { type: String, required: true },
  semester: { type: Number, required: true },
  quantMales: { type: Number, required: true, min: 0 },
  quantFemales: { type: Number, required: true, min: 0 },
  shelter: { type: Number, required: true, min: 0 },
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ Garante que só exista 1 round por user + número + semestre
RoundSchema.index(
  { codeUser: 1, numberRound: 1, semester: 1 },
  { unique: true }
);

const Round = mongoose.model("Round", RoundSchema);
export default Round;
