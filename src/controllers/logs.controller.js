import BulkActionLog from "../models/BulkActionLog.js";
import User from "../models/User.js";

function parseDate(d) {
  if (!d) return null;
  const v = new Date(d);
  if (isNaN(v)) return null;
  return v;
}

function getSort(query) {
  const map = {
    date: "createdAt",
    action: "action",
    semester: "semester",
    round: "numberRound",
    status: "statusFilter",
    affected: "affectedCount",
  };
  const key = typeof query?.sort === "string" ? query.sort : "date";
  const field = map[key] || "createdAt";
  const dir = query?.dir === "asc" ? 1 : -1;
  return { key, field, dir };
}

const buildFilter = async (query) => {
  const { start, end, email, action } = query || {};
  const filter = {};
  const d1 = parseDate(start);
  const d2 = parseDate(end);
  if (d1 || d2) {
    filter.createdAt = {};
    if (d1) filter.createdAt.$gte = d1;
    if (d2) {
      const endDay = new Date(d2);
      endDay.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDay;
    }
  }
  if (action && ["bulk_close", "bulk_reopen", "bulk_delete"].includes(action)) {
    filter.action = action;
  }
  if (email && typeof email === "string") {
    const re = new RegExp(`^${email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const userObj = await User.findOne({ email: { $regex: re } }).select("_id email name");
    filter.user = userObj ? userObj._id : null; // null -> empty results
  }
  return filter;
};

const list = async (req, res) => {
  try {
    const { start, end, email, action } = req.query || {};
    let page = Math.max(1, Number(req.query.page || 1));
    let limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
    const filter = await buildFilter(req.query);
    const sortInfo = getSort(req.query);

    const total = await BulkActionLog.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));
    if (page > pages) page = pages;

    const logs = await BulkActionLog.find(filter)
      .sort({ [sortInfo.field]: sortInfo.dir })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "user", select: "email name" })
      .lean();

    // Email suggestions (up to 500)
    let emailSuggestions = [];
    try {
      emailSuggestions = (await User.find({}).select("email -_id").limit(500).lean()).map(u => u.email).filter(Boolean);
    } catch(_e) {}

    res.render("logs/index", {
      logs,
      pagination: { page, limit, total, pages },
      filters: {
        start: start || "",
        end: end || "",
        email: email || "",
        action: action || "",
      },
      sort: { key: sortInfo.key, dir: sortInfo.dir === 1 ? "asc" : "desc" },
      emailSuggestions,
      messages: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (e) {
    req.flash("error", "Erro ao carregar logs.");
    return res.redirect("/home");
  }
};

const exportCsv = async (req, res) => {
  try {
    const filter = await buildFilter(req.query || {});
    const sortInfo = getSort(req.query || {});
    const rows = await BulkActionLog.find(filter)
      .sort({ [sortInfo.field]: sortInfo.dir })
      .limit(10000)
      .populate({ path: "user", select: "email name" })
      .lean();

    const headers = [
      'createdAt','userEmail','userName','action','semester','numberRound','statusFilter','affectedCount'
    ];
    const csv = [headers.join(',')].concat(
      rows.map(r => [
        r.createdAt ? new Date(r.createdAt).toISOString() : '',
        r.user ? (r.user.email || '') : '',
        r.user ? (r.user.name || '') : '',
        r.action || '',
        r.semester,
        (typeof r.numberRound === 'number') ? r.numberRound : '',
        r.statusFilter || '',
        r.affectedCount || 0,
      ].map(v => {
        const s = (v===undefined || v===null) ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
      }).join(','))
    ).join('\n');

    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition',`attachment; filename="logs.csv"`);
    return res.send(csv);
  } catch (e) {
    return res.status(500).send('Erro ao exportar logs');
  }
};

export default { list, exportCsv };
