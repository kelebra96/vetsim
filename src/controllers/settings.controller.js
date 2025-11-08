import Settings from "../models/Settings.js";

const COSTS_KEY = "costs";

const getCosts = async (req, res) => {
  try {
    const cfg = await Settings.findOne({ key: COSTS_KEY }).lean();
    res.render("settings/costs", {
      costs: cfg || { shelterCost: 0, maleNeuterCost: 0, femaleNeuterCost: 0, highVolumeThreshold: 200 },
      messages: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (err) {
    req.flash("error", "Erro ao carregar configurações.");
    return res.redirect("/home");
  }
};

const saveCosts = async (req, res) => {
  try {
    const shelterCost = Number(req.body.shelterCost ?? 0);
    const maleNeuterCost = Number(req.body.maleNeuterCost ?? 0);
    const femaleNeuterCost = Number(req.body.femaleNeuterCost ?? 0);
    const highVolumeThreshold = Number(req.body.highVolumeThreshold ?? 200);

    if ([shelterCost, maleNeuterCost, femaleNeuterCost, highVolumeThreshold].some(v => Number.isNaN(v) || v < 0)) {
      req.flash("error", "Valores inválidos. Use números maiores ou iguais a zero.");
      return res.redirect("/settings/costs");
    }

    await Settings.updateOne(
      { key: COSTS_KEY },
      { $set: { shelterCost, maleNeuterCost, femaleNeuterCost, highVolumeThreshold, updatedAt: new Date() } },
      { upsert: true }
    );

    req.flash("success", "Custos atualizados com sucesso.");
    return res.redirect("/settings/costs");
  } catch (err) {
    req.flash("error", "Erro ao salvar configurações.");
    return res.redirect("/settings/costs");
  }
};

export default { getCosts, saveCosts };
