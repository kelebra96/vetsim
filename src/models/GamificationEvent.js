import mongoose from "mongoose";

const GamificationEventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  amount: { type: Number, required: true },
  reason: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now, index: true },
});

const GamificationEvent = mongoose.model("GamificationEvent", GamificationEventSchema);
export default GamificationEvent;

