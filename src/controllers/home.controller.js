import Round from "../models/RoundUser.js";
import Settings from "../models/Settings.js";

const home = async (req, res) => {
    try {
        const codeUser = req.user?.code ? String(req.user.code) : null;
        const semester = Number(req.user?.semester || 1);

        if (!codeUser) {
            return res.render("home/index", { dashboard: null });
        }

        const [rounds, costsCfg] = await Promise.all([
            Round.find({ codeUser, semester }).sort({ numberRound: 1, updatedAt: 1 }).lean(),
            Settings.findOne({ key: "costs" }).lean(),
        ]);

        const costs = {
            maleNeuterCost: Number(costsCfg?.maleNeuterCost || 0),
            femaleNeuterCost: Number(costsCfg?.femaleNeuterCost || 0),
            shelterCost: Number(costsCfg?.shelterCost || 0),
        };

        const timeline = [];
        let totalMales = 0;
        let totalFemales = 0;
        let totalShelter = 0;
        let totalCost = 0;

        for (const r of rounds) {
            const males = Number(r.quantMales || 0);
            const females = Number(r.quantFemales || 0);
            const shelter = Number(r.shelter || 0);
            const total = males + females;
            const cost = (males * costs.maleNeuterCost) + (females * costs.femaleNeuterCost) + (shelter * costs.shelterCost);
            const prev = timeline[timeline.length - 1] || null;

            totalMales += males;
            totalFemales += females;
            totalShelter += shelter;
            totalCost += cost;

            timeline.push({
                round: Number(r.numberRound || 0),
                males,
                females,
                shelter,
                total,
                cost,
                status: r.status ? "active" : "closed",
                deltaTotal: prev ? (total - prev.total) : 0,
                deltaShelter: prev ? (shelter - prev.shelter) : 0,
                updatedAt: r.updatedAt || r.createdAt || null,
            });
        }

        const latest = timeline[timeline.length - 1] || null;
        const previous = timeline.length > 1 ? timeline[timeline.length - 2] : null;
        const deltaVsPrevious = (latest && previous) ? (latest.total - previous.total) : 0;

        const decisions = timeline.map((t) => ({
            round: t.round,
            title: `Round ${t.round}`,
            summary: `Castrados: ${t.total} (${t.males} machos, ${t.females} fêmeas) · Abrigo: ${t.shelter}`,
            cost: t.cost,
            status: t.status,
            updatedAt: t.updatedAt,
        }));

        return res.render("home/index", {
            dashboard: {
                semester,
                roundsCount: timeline.length,
                latest,
                previous,
                deltaVsPrevious,
                totals: {
                    males: totalMales,
                    females: totalFemales,
                    castrations: totalMales + totalFemales,
                    shelter: totalShelter,
                    cost: totalCost,
                },
                timeline,
                decisions,
            }
        });
    } catch (err) {
        console.error("Erro ao carregar dashboard da home:", err);
        return res.render("home/index", { dashboard: null });
    }
};
export default {
    home,
    async sobre(req, res) {
        res.render('sobre');
    }
};
