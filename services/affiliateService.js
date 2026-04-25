const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "data", "affiliate-links.json");

function readAffiliates() {
  try {
    if (!fs.existsSync(FILE)) return [];

    const raw = fs.readFileSync(FILE, "utf8");
    if (!raw.trim()) return [];

    return JSON.parse(raw);
  } catch (err) {
    console.error("Erro ao ler afiliados:", err.message);
    return [];
  }
}

function writeAffiliates(data) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Erro ao salvar afiliados:", err.message);
    return false;
  }
}

function normalizeAffiliate(item = {}, index = 0) {
  return {
    id: String(item.id || `affiliate-${index + 1}`),
    title: String(item.title || "Produto recomendado"),
    description: String(item.description || "Veja esta recomendação selecionada."),
    url: String(item.url || "").trim(),
    category: String(item.category || "geral"),
    tags: Array.isArray(item.tags) ? item.tags : [],
    active: item.active !== false,
    clicks: Number(item.clicks || 0),
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function getAllAffiliates() {
  return readAffiliates().map(normalizeAffiliate);
}

function getActiveAffiliates() {
  return getAllAffiliates().filter((item) => {
    return item.active && /^https?:\/\//i.test(item.url);
  });
}

function getActiveAffiliate() {
  const list = getActiveAffiliates();
  if (!list.length) return null;

  return list[Math.floor(Math.random() * list.length)];
}

function getAffiliateById(id) {
  return getAllAffiliates().find((item) => item.id === id) || null;
}

function registerAffiliateClick(id) {
  const list = getAllAffiliates();
  const index = list.findIndex((item) => item.id === id);

  if (index === -1) return null;

  list[index].clicks = Number(list[index].clicks || 0) + 1;

  writeAffiliates(list);

  return list[index];
}

function addAffiliate(data = {}) {
  const list = getAllAffiliates();

  const id =
    data.id ||
    String(data.title || "produto")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now();

  const affiliate = normalizeAffiliate({
    id,
    title: data.title,
    description: data.description,
    url: data.url,
    category: data.category,
    tags: data.tags,
    active: data.active !== false,
    clicks: 0,
    createdAt: new Date().toISOString()
  });

  list.unshift(affiliate);
  writeAffiliates(list);

  return affiliate;
}

function scoreAffiliateByContext(affiliate, context = "") {
  const text = String(context || "").toLowerCase();

  let score = 0;

  if (!text) return 1;

  if (affiliate.category && text.includes(String(affiliate.category).toLowerCase())) {
    score += 5;
  }

  affiliate.tags.forEach((tag) => {
    if (text.includes(String(tag).toLowerCase())) {
      score += 3;
    }
  });

  if (text.includes(String(affiliate.title).toLowerCase())) {
    score += 2;
  }

  return score;
}

function getAffiliatesForContext(context = "", limit = 6) {
  const list = getActiveAffiliates();

  return list
    .map((item) => ({
      ...item,
      score: scoreAffiliateByContext(item, context)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = {
  getAllAffiliates,
  getActiveAffiliates,
  getActiveAffiliate,
  getAffiliateById,
  registerAffiliateClick,
  addAffiliate,
  getAffiliatesForContext
};
