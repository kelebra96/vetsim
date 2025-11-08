import User from "../models/User.js";
import GamificationEvent from "../models/GamificationEvent.js";

export async function awardPoints(userId, amount, reason = "award") {
  if (!userId || !amount || amount <= 0) return null;
  const u = await User.findById(userId).select("type semester points level xpBySemester");
  if (!u) return null;

  let newPoints = 0;
  let newLevel = 1;

  if (u.type === "student") {
    const sem = Number(u.semester || 1);
    const idx = Math.max(0, Math.min(7, sem - 1));
    if (!Array.isArray(u.xpBySemester) || u.xpBySemester.length !== 8) {
      u.xpBySemester = [0,0,0,0,0,0,0,0];
    }
    u.xpBySemester[idx] = Math.max(0, Number(u.xpBySemester[idx] || 0) + Number(amount));
    newPoints = u.xpBySemester.reduce((a,b) => a + Number(b || 0), 0);
    newLevel = Math.max(1, Math.min(8, sem));
    u.points = newPoints;
    u.level = newLevel;
  } else {
    // admin/teacher: mantém modelo global
    newPoints = Math.max(0, Number(u.points || 0) + Number(amount));
    newLevel = Math.max(1, Math.floor(newPoints / 100) + 1);
    u.points = newPoints;
    u.level = newLevel;
  }

  await u.save();
  try {
    await GamificationEvent.create({ user: userId, amount: Number(amount), reason });
  } catch (_) {}
  return { points: newPoints, level: newLevel };
}

export default { awardPoints };
