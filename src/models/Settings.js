import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  shelterCost: { type: Number, default: 0, min: 0 },
  maleNeuterCost: { type: Number, default: 0, min: 0 },
  femaleNeuterCost: { type: Number, default: 0, min: 0 },
  highVolumeThreshold: { type: Number, default: 200, min: 0 },
  updatedAt: { type: Date, default: Date.now },
});

// índice já criado pelo unique: true no campo acima

const Settings = mongoose.model("Settings", SettingsSchema);
export default Settings;
