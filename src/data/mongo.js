import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_ATLAS_URI = process.env.MONGODB_ATLAS_URI;
const MONGODB_LOCAL_URI = process.env.MONGODB_LOCAL_URI;

const connectionDatabase = async () => {
  console.log("⏳ Tentando conectar ao MongoDB Atlas...");

  try {
    await mongoose.connect(MONGODB_ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado ao MongoDB Atlas");
  } catch (atlasError) {
    console.error(
      "❌ Falha na conexão com o MongoDB Atlas:",
      atlasError.message
    );
    console.log("🔁 Tentando conectar ao MongoDB Local...");

    try {
      await mongoose.connect(MONGODB_LOCAL_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ Conectado ao MongoDB Local");
    } catch (localError) {
      console.error(
        "❌ Falha na conexão com o MongoDB Local também:",
        localError.message
      );
    }
  }
};

export default connectionDatabase;
