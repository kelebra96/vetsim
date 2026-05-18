import User from "../models/User.js";
import GamificationEvent from "../models/GamificationEvent.js";

const XP_PER_LEVEL = 100;
const MAX_SEMESTER_LEVEL = 8;

function computeLevel(type, points, semester) {
  if (type === "student") return Math.max(1, Math.min(MAX_SEMESTER_LEVEL, Number(semester || 1)));
  return Math.max(1, Math.floor(points / XP_PER_LEVEL) + 1);
}

export async function awardPoints(userId, amount, reason = "award") {
  if (!userId || !amount || amount <= 0) return null;
  const u = await User.findById(userId).select("type semester points level xpBySemester");
  if (!u) return null;
  if (u.type === "admin" || u.type === "teacher") return null;

  let newPoints = 0;

  if (u.type === "student") {
    const sem = Number(u.semester || 1);
    const idx = Math.max(0, Math.min(7, sem - 1));
    if (!Array.isArray(u.xpBySemester) || u.xpBySemester.length !== 8) {
      u.xpBySemester = [0,0,0,0,0,0,0,0];
    }
    u.xpBySemester[idx] = Math.max(0, Number(u.xpBySemester[idx] || 0) + Number(amount));
    newPoints = u.xpBySemester.reduce((a,b) => a + Number(b || 0), 0);
  } else {
    newPoints = Math.max(0, Number(u.points || 0) + Number(amount));
  }

  const newLevel = computeLevel(u.type, newPoints, u.semester);
  u.points = newPoints;
  u.level = newLevel;

  await u.save();
  try {
    await GamificationEvent.create({ user: userId, amount: Number(amount), reason });
  } catch (err) {
    console.warn("GamificationEvent.create failed:", err.message);
  }
  return { points: newPoints, level: newLevel };
}

export default { awardPoints };
