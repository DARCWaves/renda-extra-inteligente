const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "data", "affiliate-links.json");

function ensureFile() {
  const dir = path.join(__dirname, "..", "data");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify([], null, 2), "utf8");
  }
}

function readAffiliates() {
  ensureFile();

  try {
    const raw = fs.readFileSync(FILE, "utf8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAffiliates(data) {
  ensureFile();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf8");
}

function normalizeProduct(item) {
  return {
    id: item.id,
    title: item.title || "Produto recomendado",
    description: item.description || "Produto recomendado.",
    url: item.url,
    image: item.image || "",
    price: item.price || "",
    badge: item.badge || "Recomendado",
    category: item.category || "geral",
    tags: Array.isArray(item.tags) ? item.tags : [],
    clicks: Number(item.clicks || 0),
    active: item.active !== false,
    source: item.source || "telegram",
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function getTelegramProducts() {
  return readAffiliates()
    .filter(item => item && item.active !== false)
    .filter(item => item.url && item.title)
    .filter(item => !item.source || item.source === "telegram")
    .map(normalizeProduct)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getActiveAffiliates(limit = 12) {
  return getTelegramProducts().slice(0, limit);
}

function getActiveAffiliate() {
  return getActiveAffiliates(1)[0] || null;
}

function getAffiliatesForContext(context = "", limit = 12) {
  return getActiveAffiliates(limit);
}

function registerAffiliateClick(id, meta = {}) {
  const affiliates = readAffiliates();
  const item = affiliates.find(product => product.id === id);

  if (!item || item.active === false || !item.url) {
    return null;
  }

  item.source = item.source || "telegram";
  item.clicks = Number(item.clicks || 0) + 1;
  item.lastClickAt = new Date().toISOString();
  item.lastClickMeta = {
    source: meta.source || "",
    page: meta.page || "",
    userAgent: meta.userAgent || "",
    ip: meta.ip || ""
  };

  saveAffiliates(affiliates);

  return item;
}

function getAffiliateStats() {
  return getTelegramProducts()
    .slice()
    .sort((a, b) => Number(b.clicks || 0) - Number(a.clicks || 0));
}

module.exports = {
  getActiveAffiliate,
  getActiveAffiliates,
  getAffiliatesForContext,
  registerAffiliateClick,
  getAffiliateStats
};
