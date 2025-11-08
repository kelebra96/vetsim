import User from "../models/User.js";
import GamificationEvent from "../models/GamificationEvent.js";

const myXP = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name points level").lean();
    const points = Number(user?.points || 0);
    const level = Number(user?.level || Math.floor(points / 100) + 1);
    const inLevel = points % 100;
    const events = await GamificationEvent.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.render("gamification/me_xp", {
      summary: { name: user?.name || "", points, level, inLevel },
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

