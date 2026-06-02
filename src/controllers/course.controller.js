import Course from "../models/Course.js";
import User from "../models/User.js";
import { advanceSemesters } from "../services/semesterAdvance.service.js";

const listView = async (req, res) => {
  try {
    const courses = await Course.find().sort({ name: 1 }).lean();

    // Conta alunos por curso
    const counts = await User.aggregate([
      { $match: { type: "student", status: true } },
      { $group: { _id: "$courseId", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

    const enriched = courses.map((c) => ({
      ...c,
      studentCount: countMap[String(c._id)] ?? 0,
    }));

    const unassigned = await User.countDocuments({ type: "student", status: true, courseId: null });

    res.render("settings/courses", {
      courses: enriched,
      unassigned,
      messages: req.flash("error"),
      success: req.flash("success"),
    });
  } catch {
    req.flash("error", "Erro ao carregar graduações.");
    res.redirect("/home");
  }
};

const create = async (req, res) => {
  const { name, maxSemesters, description } = req.body;

  if (!name || !maxSemesters) {
    req.flash("error", "Nome e número de semestres são obrigatórios.");
    return res.redirect("/settings/courses");
  }

  const max = Number(maxSemesters);
  if (!Number.isFinite(max) || max < 1 || max > 20) {
    req.flash("error", "Número de semestres deve ser entre 1 e 20.");
    return res.redirect("/settings/courses");
  }

  try {
    await Course.create({ name: name.trim(), maxSemesters: max, description: (description || "").trim() });
    req.flash("success", `Graduação "${name}" criada com ${max} semestres.`);
  } catch (err) {
    if (err.code === 11000) {
      req.flash("error", "Já existe uma graduação com esse nome.");
    } else {
      req.flash("error", "Erro ao criar graduação.");
    }
  }
  res.redirect("/settings/courses");
};

const remove = async (req, res) => {
  const { id } = req.params;
  try {
    const course = await Course.findById(id).lean();
    if (!course) {
      req.flash("error", "Graduação não encontrada.");
      return res.redirect("/settings/courses");
    }

    // Desvincula alunos antes de remover
    const updated = await User.updateMany({ courseId: id }, { $set: { courseId: null } });
    await Course.findByIdAndDelete(id);

    req.flash(
      "success",
      `Graduação "${course.name}" removida. ${updated.modifiedCount} aluno(s) desvinculado(s) (passam a usar o limite padrão de 8 semestres).`
    );
  } catch {
    req.flash("error", "Erro ao remover graduação.");
  }
  res.redirect("/settings/courses");
};

const triggerAdvance = async (req, res) => {
  try {
    const result = await advanceSemesters();
    req.flash(
      "success",
      `Virada de semestre concluída: ${result.advanced} aluno(s) avançaram, ${result.atLimit} já estão no semestre final.`
    );
  } catch {
    req.flash("error", "Erro ao executar virada de semestre.");
  }
  res.redirect("/settings/courses");
};

export default { listView, create, remove, triggerAdvance };
