import User from "../models/User.js";

const DEFAULT_MAX_SEMESTERS = 8;

/**
 * Avança o semestre de todos os alunos ativos que ainda não atingiram
 * o limite máximo definido pela graduação (courseId.maxSemesters).
 * Alunos sem curso atribuído usam DEFAULT_MAX_SEMESTERS como teto.
 *
 * Retorna um relatório com totais e os IDs dos alunos afetados.
 */
export async function advanceSemesters() {
  const students = await User.find({ type: "student", status: true })
    .populate("courseId", "name maxSemesters")
    .select("_id name email semester courseId xpBySemester")
    .lean();

  const advanced = [];
  const atLimit = [];

  for (const student of students) {
    const max = student.courseId?.maxSemesters ?? DEFAULT_MAX_SEMESTERS;

    if (student.semester >= max) {
      atLimit.push({ id: student._id, name: student.name, semester: student.semester, max });
      continue;
    }

    const newSemester = student.semester + 1;

    // Garante que xpBySemester tem entradas suficientes para o novo semestre
    const currentXp = Array.isArray(student.xpBySemester) ? student.xpBySemester : [];
    const paddedXp =
      currentXp.length < newSemester
        ? [...currentXp, ...Array(newSemester - currentXp.length).fill(0)]
        : currentXp;

    await User.findByIdAndUpdate(student._id, {
      $set: { semester: newSemester, xpBySemester: paddedXp, updatedAt: new Date() },
    });

    advanced.push({ id: student._id, name: student.name, from: student.semester, to: newSemester });
  }

  return {
    advanced: advanced.length,
    atLimit: atLimit.length,
    total: students.length,
    details: { advanced, atLimit },
  };
}

/**
 * Avança o semestre de um aluno específico.
 * Retorna o resultado ou lança erro se já estiver no limite.
 */
export async function advanceStudentSemester(userId) {
  const student = await User.findById(userId)
    .populate("courseId", "name maxSemesters")
    .select("_id name email semester courseId xpBySemester")
    .lean();

  if (!student) throw new Error("Aluno não encontrado.");

  const max = student.courseId?.maxSemesters ?? DEFAULT_MAX_SEMESTERS;

  if (student.semester >= max) {
    throw new Error(
      `Aluno já está no semestre máximo (${max}) da graduação "${student.courseId?.name ?? "padrão"}".`
    );
  }

  const newSemester = student.semester + 1;
  const currentXp = Array.isArray(student.xpBySemester) ? student.xpBySemester : [];
  const paddedXp =
    currentXp.length < newSemester
      ? [...currentXp, ...Array(newSemester - currentXp.length).fill(0)]
      : currentXp;

  await User.findByIdAndUpdate(userId, {
    $set: { semester: newSemester, xpBySemester: paddedXp, updatedAt: new Date() },
  });

  return { from: student.semester, to: newSemester };
}
