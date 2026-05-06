const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "data", "affiliates.json");

function ensureFile() {
  const dir = path.join(__dirname, "..", "data");

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify([], null, 2), "utf8");
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

function isRealTelegramProduct(item) {
  return Boolean(
    item &&
    item.active !== false &&
    item.url &&
    item.title &&
    item.source === "telegram_link" &&
    item.createdBy === "telegram_bot"
  );
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
    category: String(item.category || "geral").toLowerCase(),
    tags: Array.isArray(item.tags) ? item.tags : [],
    clicks: Number(item.clicks || 0),
    active: item.active !== false,
    source: item.source,
    createdBy: item.createdBy,
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function getTelegramProducts() {
  const raw = readAffiliates();
  return raw
    .filter((item) => item && item.active !== false && item.url)
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
  const products = getTelegramProducts();
  const lowerContext = String(context || "").toLowerCase();

  // Tenta encontrar produtos que batem com a categoria ou palavras no contexto
  const contextual = products.filter(p => {
    return lowerContext.includes(p.category) || 
           lowerContext.includes(p.title.toLowerCase());
  });

  if (contextual.length > 0) {
    return contextual.slice(0, limit);
  }

  return products.slice(0, limit);
}

function registerAffiliateClick(id, meta = {}) {
  const affiliates = readAffiliates();
  const item = affiliates.find(product => product.id === id);

  if (!isRealTelegramProduct(item)) return null;

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
