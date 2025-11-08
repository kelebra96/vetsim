import dotenv from 'dotenv';
import db from '../src/data/mongo.js';
import User from '../src/models/User.js';

dotenv.config();

async function ensureUser({ name, email, password, code, semester, type }) {
  const exists = await User.findOne({ email }).select('_id');
  if (exists) {
    console.log(`Usuário já existe: ${email} (${type})`);
    return false;
  }
  const user = new User({ name, code, email, semester, password, status: true, type });
  await user.save();
  console.log(`Criado: ${email} (${type}) | senha: ${password}`);
  return true;
}

async function main() {
  try {
    await db();

    // Admin (configurável por .env)
    await ensureUser({
      name: process.env.SEED_TEST_NAME || 'Admin Teste',
      email: process.env.SEED_TEST_EMAIL || 'teste@vetsim.local',
      password: process.env.SEED_TEST_PASSWORD || 'Teste@123',
      code: Number(process.env.SEED_TEST_CODE || 9999),
      semester: Number(process.env.SEED_TEST_SEMESTER || 1),
      type: process.env.SEED_TEST_ROLE || 'admin',
    });

    // Student padrão
    await ensureUser({
      name: process.env.SEED_STUDENT_NAME || 'Aluno Teste',
      email: process.env.SEED_STUDENT_EMAIL || 'aluno@vetsim.local',
      password: process.env.SEED_STUDENT_PASSWORD || 'Aluno@123',
      code: Number(process.env.SEED_STUDENT_CODE || 1001),
      semester: Number(process.env.SEED_STUDENT_SEMESTER || 1),
      type: 'student',
    });

    console.log('Seed finalizado.');
    console.log('Logins padrão:');
    console.log('- Admin:  teste@vetsim.local  /  Teste@123');
    console.log('- Aluno:  aluno@vetsim.local   /  Aluno@123');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao executar seed:', err?.message || err);
    process.exit(1);
  }
}

main();
