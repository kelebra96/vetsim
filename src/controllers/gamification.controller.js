import User from "../models/User.js";
import GamificationEvent from "../models/GamificationEvent.js";

const myXP = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name points level streakCount streakLast").lean();
    const points = Number(user?.points || 0);
    const level = Number(user?.level || Math.floor(points / 100) + 1);
    const inLevel = points % 100;
    const events = await GamificationEvent.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const listedEventsSum = events.reduce((acc, ev) => acc + Number(ev?.amount || 0), 0);
    const listedVsTotalDiff = points - listedEventsSum;

    res.render("gamification/me_xp", {
      summary: {
        name: user?.name || "",
        points,
        level,
        inLevel,
        streak: Number(user?.streakCount || 0),
        streakLast: user?.streakLast || null,
        listedEventsSum,
        listedVsTotalDiff,
      },
      events,
      messages: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (err) {
    req.flash("error", "Erro ao carregar XP.");
    return res.redirect("/home");
  }
};

export default { myXP };

// Persist streak across devices
export const getStreak = async (req, res) => {
  try {
    const u = await User.findById(req.user.id).select('streakCount streakLast').lean();
    return res.json({ streak: Number(u?.streakCount || 0), last: u?.streakLast || null });
  } catch (e) {
    return res.status(500).json({ streak: 0, last: null });
  }
};

export const tickStreakToday = async (req, res) => {
  try {
    const u = await User.findById(req.user.id).select('streakCount streakLast').lean();
    const now = new Date();
    const today = now.toDateString();
    let count = Number(u?.streakCount || 0);
    const last = u?.streakLast ? new Date(u.streakLast).toDateString() : null;
    if (last !== today) {
      count = count + 1;
      await User.findByIdAndUpdate(req.user.id, { $set: { streakCount: count, streakLast: now, updatedAt: new Date() } });
    }
    return res.json({ streak: count, last: now });
  } catch (e) {
    return res.status(500).json({ streak: 0, last: null });
  }
};
