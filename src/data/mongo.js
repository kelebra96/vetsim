import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const LOCAL_URI = process.env.MONGODB_LOCAL_URI || "mongodb://localhost:27017/vetsim";
const ATLAS_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI || "";

const connectionDatabase = async () => {
  const uri = ATLAS_URI && ATLAS_URI.trim().length > 0 ? ATLAS_URI : LOCAL_URI;
  const isAtlas = uri === ATLAS_URI;
  console.log(isAtlas ? "🔗 Conectando ao MongoDB Atlas..." : "🔗 Conectando ao MongoDB Local...");
  try {
    await mongoose.connect(uri);
    console.log(isAtlas ? "✅ Conectado ao MongoDB Atlas" : "✅ Conectado ao MongoDB Local");
  } catch (err) {
    console.error(isAtlas ? "❌ Falha na conexão com o MongoDB Atlas:" : "❌ Falha na conexão com o MongoDB Local:", err?.message || err);
    if (isAtlas) {
      console.log("↪️ Tentando fallback para MongoDB local...");
      try {
        await mongoose.connect(LOCAL_URI);
        console.log("✅ Fallback: conectado ao MongoDB Local");
      } catch (e2) {
        console.error("❌ Falha também no MongoDB Local:", e2?.message || e2);
      }
    }
  }
};

export default connectionDatabase;