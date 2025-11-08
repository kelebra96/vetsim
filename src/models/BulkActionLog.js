import mongoose from "mongoose";

const BulkActionLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  action: { type: String, required: true, enum: ["bulk_close", "bulk_reopen", "bulk_delete"] },
  semester: { type: Number, required: true },
  numberRound: { type: Number, required: false },
  statusFilter: { type: String, required: false },
  affectedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, index: true },
});

const BulkActionLog = mongoose.model("BulkActionLog", BulkActionLogSchema);
export default BulkActionLog;

