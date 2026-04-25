const fs = require("fs");
const path = require("path");

const AFFILIATES_FILE = path.join(__dirname, "..", "data", "affiliate-links.json");
const CLICKS_FILE = path.join(__dirname, "..", "data", "affiliate-clicks.json");

function ensureFile(file, fallback) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2), "utf8");
  }
}

function readJson(file, fallback) {
  try {
    ensureFile(file, fallback);
    const raw = fs.readFileSync(file, "utf8");
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error("Erro ao ler JSON:", err.message);
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function getAllAffiliates() {
  return readJson(AFFILIATES_FILE, []);
}

function getActiveAffiliates() {
  return getAllAffiliates().filter((item) => item.active !== false && item.url);
}

function getActiveAffiliate() {
  const list = getActiveAffiliates();
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function getAffiliateById(id) {
  return getAllAffiliates().find((item) => item.id === id) || null;
}

function scoreAffiliateByContext(affiliate, context = "") {
  const text = String(context || "").toLowerCase();
  let score = 0;

  if (!text) return 1;

  if (affiliate.category && text.includes(String(affiliate.category).toLowerCase())) {
    score += 5;
  }

  if (Array.isArray(affiliate.tags)) {
    affiliate.tags.forEach((tag) => {
      if (text.includes(String(tag).toLowerCase())) {
        score += 3;
      }
    });
  }

  if (affiliate.title && text.includes(String(affiliate.title).toLowerCase())) {
    score += 2;
  }

  return score;
}

function getAffiliatesForContext(context = "", limit = 8) {
  return getActiveAffiliates()
    .map((item) => ({
      ...item,
      score: scoreAffiliateByContext(item, context)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function registerAffiliateClick(id, meta = {}) {
  const affiliates = getAllAffiliates();
  const index = affiliates.findIndex((item) => item.id === id);

  if (index === -1) return null;

  affiliates[index].clicks = Number(affiliates[index].clicks || 0) + 1;
  affiliates[index].lastClickAt = new Date().toISOString();

  writeJson(AFFILIATES_FILE, affiliates);

  const clicks = readJson(CLICKS_FILE, []);

  clicks.unshift({
    id: `${id}-${Date.now()}`,
    affiliateId: id,
    title: affiliates[index].title,
    category: affiliates[index].category || "geral",
    url: affiliates[index].url,
    clickedAt: new Date().toISOString(),
    source: meta.source || "site",
    page: meta.page || "",
    userAgent: meta.userAgent || "",
    ip: meta.ip || ""
  });

  writeJson(CLICKS_FILE, clicks.slice(0, 5000));

  return affiliates[index];
}

function getAffiliateStats() {
  const affiliates = getAllAffiliates();
  const clicks = readJson(CLICKS_FILE, []);

  return affiliates.map((item) => {
    const productClicks = clicks.filter((click) => click.affiliateId === item.id);

    return {
      id: item.id,
      title: item.title,
      category: item.category,
      url: item.url,
      active: item.active !== false,
      clicks: Number(item.clicks || 0),
      trackedClicks: productClicks.length,
      lastClickAt: item.lastClickAt || null
    };
  });
}

module.exports = {
  getAllAffiliates,
  getActiveAffiliates,
  getActiveAffiliate,
  getAffiliateById,
  getAffiliatesForContext,
  registerAffiliateClick,
  getAffiliateStats
};
