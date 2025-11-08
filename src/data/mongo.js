import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_LOCAL_URI = process.env.MONGODB_LOCAL_URI || "mongodb://localhost:27017/vetsim";

const connectionDatabase = async () => {
  console.log("🔌 Conectando ao MongoDB Local...");
  try {
    await mongoose.connect(MONGODB_LOCAL_URI);
    console.log("✅ Conectado ao MongoDB Local");
  } catch (err) {
    console.error("❌ Falha na conexão com o MongoDB Local:", err.message);
  }
};

export default connectionDatabase;

