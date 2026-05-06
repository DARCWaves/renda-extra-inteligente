require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = String(process.env.TELEGRAM_CHAT_ID || "");
const BASE_URL = process.env.BASE_URL || process.env.SITE_URL || "http://localhost:3000";
const FILE = path.join(__dirname, "data", "affiliate-links.json");

function ensureFile() {
  const dir = path.join(__dirname, "data");
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

function isAdmin(msg) {
  if (!ADMIN_CHAT_ID) return true;
  return String(msg.chat.id) === ADMIN_CHAT_ID;
}

function slugify(text) {
  return String(text || "produto")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function extractUrlFromMessage(msg) {
  const text = msg.text || msg.caption || "";

  const entities = [
    ...(msg.entities || []),
    ...(msg.caption_entities || [])
  ];

  for (const entity of entities) {
    if (entity.type === "url") {
      return text.slice(entity.offset, entity.offset + entity.length).trim();
    }

    if (entity.type === "text_link" && entity.url) {
      return entity.url.trim();
    }
  }

  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0].trim() : "";
}

function cleanText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/[\n\r\t]/g, " ")
    .trim();
}

function getMeta(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`, "i")
  ];

  for (const pattern of patterns) {
    const found = html.match(pattern);
    if (found && found[1]) return cleanText(found[1]);
  }

  return "";
}

function extractMercadoLivreId(url) {
  const decoded = decodeURIComponent(String(url || ""));

  const patterns = [
    /\/(MLB-\d+)/i,
    /\b(MLB\d{6,})\b/i,
    /\bMLB-(\d{6,})\b/i
  ];

  for (const pattern of patterns) {
    const found = decoded.match(pattern);
    if (found) {
      return found[1].replace("-", "").toUpperCase();
    }
  }

  return "";
}

async function getMercadoLivreProduct(url) {
  const id = extractMercadoLivreId(url);
  if (!id) return null;

  try {
    const response = await axios.get(`https://api.mercadolibre.com/items/${id}`, {
      timeout: 12000,
      headers: {
        "Accept": "application/json"
      }
    });

    const data = response.data || {};

    return {
      title: data.title || "Produto Mercado Livre",
      description: data.title || "Produto recomendado do Mercado Livre.",
      image: Array.isArray(data.pictures) && data.pictures[0] ? data.pictures[0].secure_url || data.pictures[0].url : "",
      price: typeof data.price === "number"
        ? data.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : "",
      url
    };
  } catch {
    return null;
  }
}

async function fetchGenericProduct(url) {
  try {
    const response = await axios.get(url, {
      timeout: 12000,
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    const finalUrl = response.request?.res?.responseUrl || url;
    const html = String(response.data || "");

    const title =
      getMeta(html, "og:title") ||
      (html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1] || "");

    const description =
      getMeta(html, "og:description") ||
      getMeta(html, "description") ||
      "Produto recomendado.";

    const image =
      getMeta(html, "og:image") ||
      getMeta(html, "twitter:image") ||
      "";

    const priceMatch = html.match(/R\$\s?[\d.]+,\d{2}/i);

    return {
      title: cleanText(title) || "Produto recomendado",
      description: cleanText(description),
      image,
      price: priceMatch ? priceMatch[0] : "",
      url
    };
  } catch {
    return {
      title: "Produto recomendado",
      description: "Produto cadastrado pelo Telegram.",
      image: "",
      price: "",
      url
    };
  }
}

function autoCategory(text) {
  const t = String(text || "").toLowerCase();

  if (t.includes("cueca") || t.includes("meia") || t.includes("roupa") || t.includes("revenda") || t.includes("atacado")) return "renda-extra";
  if (t.includes("livro") || t.includes("educação financeira") || t.includes("finanças")) return "financas";
  if (t.includes("programação") || t.includes("javascript") || t.includes("python") || t.includes("c#")) return "programacao";
  if (t.includes("ferramenta") || t.includes("furadeira") || t.includes("trabalho")) return "trabalho";
  if (t.includes("investimento") || t.includes("ações") || t.includes("fii")) return "investimentos";

  return "geral";
}

function autoTags(text) {
  const t = String(text || "").toLowerCase();
  const tags = new Set(["telegram", "produto"]);

  if (t.includes("cueca")) ["cueca", "moda", "revenda"].forEach(x => tags.add(x));
  if (t.includes("meia")) ["meia", "revenda", "renda-extra"].forEach(x => tags.add(x));
  if (t.includes("livro")) ["livro", "educacao", "financas"].forEach(x => tags.add(x));
  if (t.includes("programação")) ["programacao", "tecnologia"].forEach(x => tags.add(x));
  if (t.includes("planilha")) ["planilha", "controle-financeiro"].forEach(x => tags.add(x));

  return Array.from(tags);
}

async function buildProductFromUrl(url) {
  const ml = await getMercadoLivreProduct(url);
  if (ml) return ml;

  return await fetchGenericProduct(url);
}

async function saveLinkFromUrl(url) {
  const product = await buildProductFromUrl(url);
  const baseText = `${product.title} ${product.description} ${url}`;
  const category = autoCategory(baseText);
  const tags = autoTags(baseText);

  const affiliates = readAffiliates();

  const item = {
    id: `${slugify(product.title)}-${Date.now()}`,
    title: product.title,
    description: product.description,
    url: product.url,
    image: product.image || "",
    price: product.price || "",
    badge: "Recomendado",
    category,
    tags,
    active: true,
    source: "telegram_link",
    createdBy: "telegram_bot",
    clicks: 0,
    createdAt: new Date().toISOString()
  };

  affiliates.unshift(item);
  saveAffiliates(affiliates);

  return item;
}

function startTelegramBot() {
  if (!TOKEN) {
    console.log("⚠️ TELEGRAM_BOT_TOKEN não configurado.");
    return null;
  }

  if (global.__TELEGRAM_BOT_STARTED__) {
    console.log("⚠️ Bot Telegram já iniciado.");
    return null;
  }

  global.__TELEGRAM_BOT_STARTED__ = true;

  const bot = new TelegramBot(TOKEN, { polling: true });

  bot.onText(/\/start|\/help/, (msg) => {
    if (!isAdmin(msg)) return;

    bot.sendMessage(msg.chat.id, `
🤖 Renda Extra Inteligente Bot

Envie APENAS o link real do produto.

Eu vou cadastrar automaticamente:
• nome
• imagem
• preço
• categoria
• link rastreável

Comandos:
/list
/stats
/delete ID
/toggle ID
    `.trim());
  });

  bot.on("message", async (msg) => {
    if (!isAdmin(msg)) return;

    const text = msg.text || msg.caption || "";

    if (text.startsWith("/start") || text.startsWith("/help")) return;
    if (text.startsWith("/list") || text.startsWith("/stats") || text.startsWith("/delete") || text.startsWith("/toggle")) return;

    const url = extractUrlFromMessage(msg);

    if (!url) {
      return bot.sendMessage(msg.chat.id, "Envie um link real de produto para cadastrar.");
    }

    if (url.includes("renda-extra-inteligente.onrender.com")) {
      return bot.sendMessage(msg.chat.id, "Esse é link do seu próprio site. Envie o link direto do produto.");
    }

    const loading = await bot.sendMessage(msg.chat.id, "🔎 Lendo o produto e cadastrando...");

    try {
      const item = await saveLinkFromUrl(url);

      await bot.sendMessage(msg.chat.id, `
✅ Produto cadastrado automaticamente!

Produto:
${item.title}

Categoria:
${item.category}

Imagem:
${item.image ? "Encontrada" : "Não encontrada"}

Preço:
${item.price || "Não identificado"}

Link rastreável:
${BASE_URL}/out/${item.id}
      `.trim());

      try {
        await bot.deleteMessage(msg.chat.id, loading.message_id);
      } catch {}
    } catch (err) {
      bot.sendMessage(msg.chat.id, `❌ Erro ao cadastrar: ${err.message}`);
    }
  });

  bot.onText(/\/list/, (msg) => {
    if (!isAdmin(msg)) return;

    const affiliates = readAffiliates()
      .filter(item => item.source === "telegram_link" && item.createdBy === "telegram_bot");

    if (!affiliates.length) {
      return bot.sendMessage(msg.chat.id, "Nenhum produto cadastrado pelo Telegram.");
    }

    const text = affiliates.slice(0, 20).map((p, i) => {
      return `${i + 1}. ${p.title}
ID: ${p.id}
Preço: ${p.price || "não identificado"}
Imagem: ${p.image ? "sim" : "não"}
Categoria: ${p.category}
Cliques: ${p.clicks || 0}`;
    }).join("\n\n");

    bot.sendMessage(msg.chat.id, text);
  });

  bot.onText(/\/stats/, (msg) => {
    if (!isAdmin(msg)) return;

    const affiliates = readAffiliates()
      .filter(item => item.source === "telegram_link" && item.createdBy === "telegram_bot")
      .sort((a, b) => Number(b.clicks || 0) - Number(a.clicks || 0));

    if (!affiliates.length) {
      return bot.sendMessage(msg.chat.id, "Nenhum dado ainda.");
    }

    const text = affiliates.slice(0, 15).map((p, i) => {
      return `${i + 1}. ${p.title}
Cliques: ${p.clicks || 0}
Preço: ${p.price || "não identificado"}`;
    }).join("\n\n");

    bot.sendMessage(msg.chat.id, `📊 Ranking de cliques:\n\n${text}`);
  });

  bot.onText(/\/delete\s+(.+)/, (msg, match) => {
    if (!isAdmin(msg)) return;

    const id = match[1].trim();
    const affiliates = readAffiliates();
    const next = affiliates.filter(p => p.id !== id);

    if (next.length === affiliates.length) {
      return bot.sendMessage(msg.chat.id, "Produto não encontrado.");
    }

    saveAffiliates(next);
    bot.sendMessage(msg.chat.id, "Produto removido.");
  });

  bot.onText(/\/toggle\s+(.+)/, (msg, match) => {
    if (!isAdmin(msg)) return;

    const id = match[1].trim();
    const affiliates = readAffiliates();
    const item = affiliates.find(p => p.id === id);

    if (!item) {
      return bot.sendMessage(msg.chat.id, "Produto não encontrado.");
    }

    item.active = !item.active;
    saveAffiliates(affiliates);

    bot.sendMessage(msg.chat.id, `Produto agora está: ${item.active ? "ATIVO" : "INATIVO"}`);
  });

  bot.on("polling_error", (err) => {
    console.log("Erro polling Telegram:", err.message);
  });

  console.log("🤖 Telegram bot iniciado corretamente.");
  return bot;
}

if (require.main === module) {
  startTelegramBot();
}

module.exports = { startTelegramBot };
