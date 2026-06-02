/**
 * Migração: avatares de caminho de arquivo → base64 data URL no MongoDB
 *
 * Contexto: avatares eram salvos em public/uploads/avatars/ no filesystem local.
 * Após a correção (commit 7481d24), novos uploads são armazenados como data URL
 * diretamente no campo avatarUrl do documento User.
 *
 * Este script converte registros legados que ainda apontam para /uploads/avatars/.
 * Se o arquivo não existir no disco, limpa o campo (usa o avatar padrão do sistema).
 *
 * Uso:
 *   node scripts/migrate_avatars_to_base64.js
 *
 * Deve ser executado no servidor que possui os arquivos em public/uploads/avatars/.
 * Após rodar com sucesso, o diretório public/uploads/avatars/ pode ser removido.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "..", "public");

const MIME = {
  ".jpeg": "image/jpeg",
  ".jpg":  "image/jpeg",
  ".png":  "image/png",
  ".gif":  "image/gif",
  ".webp": "image/webp",
};

const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));

async function run() {
  const uri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_LOCAL_URI;
  await mongoose.connect(uri);
  console.log("Conectado ao MongoDB.");

  const users = await User.find({ avatarUrl: /^\/uploads\// })
    .select("_id name email avatarUrl")
    .lean();

  console.log(`Usuários com avatar legado: ${users.length}`);
  if (users.length === 0) {
    console.log("Nada a migrar.");
    await mongoose.disconnect();
    return;
  }

  let migrated = 0, cleaned = 0;

  for (const u of users) {
    const filePath = path.join(PUBLIC_DIR, u.avatarUrl);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Arquivo ausente — limpando: ${u.name} (${u.email}) | ${u.avatarUrl}`);
      await User.findByIdAndUpdate(u._id, { $set: { avatarUrl: "", updatedAt: new Date() } });
      cleaned++;
      continue;
    }

    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || "image/jpeg";
    const buf  = fs.readFileSync(filePath);
    const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;

    await User.findByIdAndUpdate(u._id, { $set: { avatarUrl: dataUrl, updatedAt: new Date() } });
    console.log(`✅ ${u.name} (${u.email}) | ${buf.length} bytes → data URL`);
    migrated++;
  }

  console.log(`\nConcluído: ${migrated} migrado(s), ${cleaned} limpo(s) (arquivo ausente).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
