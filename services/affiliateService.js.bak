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

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeProduct(item) {
  return {
    id: item.id,
    title: item.title,
    description: item.description || "Produto recomendado.",
    url: item.url,
    image: item.image || "",
    price: item.price || "",
    badge: item.badge || "Recomendado",
    category: item.category || "geral",
    tags: Array.isArray(item.tags) ? item.tags : [],
    clicks: Number(item.clicks || 0),
    active: item.active !== false,
    source: item.source || "",
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function onlyTelegramProducts() {
  return readAffiliates()
    .filter(item => item && item.active !== false)
    .filter(item => item.url && item.title)
    .filter(item => item.source === "telegram")
    .map(normalizeProduct);
}

function getActiveAffiliates(limit = 8) {
  return onlyTelegramProducts().slice(0, limit);
}

function getActiveAffiliate() {
  return getActiveAffiliates(1)[0] || null;
}

function getAffiliatesForContext(context = "", limit = 8) {
  const products = onlyTelegramProducts();

  if (!products.length) {
    return [];
  }

  const query = normalizeText(context);

  const scored = products.map(item => {
    const text = normalizeText([
      item.title,
      item.description,
      item.category,
      ...(item.tags || [])
    ].join(" "));

    let score = 0;

    if (query && text) {
      query.split(/\s+/).forEach(word => {
        if (word.length > 2 && text.includes(word)) {
          score += 1;
        }
      });
    }

    if (item.image) score += 3;
    if (item.price) score += 1;
    if (item.clicks) score += Math.min(Number(item.clicks || 0), 10) / 10;

    return { item, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map(row => row.item)
    .slice(0, limit);
}

function registerAffiliateClick(id, meta = {}) {
  const affiliates = readAffiliates();
  const item = affiliates.find(product => product.id === id);

  if (!item || item.active === false || !item.url || item.source !== "telegram") {
    return null;
  }

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
  return onlyTelegramProducts()
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
