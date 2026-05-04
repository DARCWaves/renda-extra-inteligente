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

function slugify(text) {
  return String(text || "produto")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);
}

function isAdmin(msg) {
  if (!ADMIN_CHAT_ID) return true;
  return String(msg.chat.id) === ADMIN_CHAT_ID;
}

function extractFirstUrl(text) {
  const match = String(text || "").match(/https?:\/\/[^\s]+/i);
  return match ? match[0].trim() : "";
}

function cleanText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/[\n\r\t]/g, " ")
    .trim();
}

function getMeta(html, property) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["'][^>]*>`, "i")
  ];

  for (const pattern of patterns) {
    const found = html.match(pattern);
    if (found && found[1]) return cleanText(found[1]);
  }

  return "";
}

function getTitle(html) {
  const ogTitle = getMeta(html, "og:title");
  if (ogTitle) return ogTitle;

  const title = html.match(/<title[^>]*>(.*?)<\/title>/is);
  return title && title[1] ? cleanText(title[1]) : "";
}

function getDescription(html) {
  return (
    getMeta(html, "og:description") ||
    getMeta(html, "description") ||
    "Produto recomendado para quem quer melhorar sua vida financeira."
  );
}

function getImage(html, baseUrl) {
  let image =
    getMeta(html, "og:image") ||
    getMeta(html, "twitter:image") ||
    getMeta(html, "image");

  if (!image) return "";

  try {
    image = new URL(image, baseUrl).href;
  } catch {}

  return image;
}

function getPrice(html) {
  const metaPrice =
    getMeta(html, "product:price:amount") ||
    getMeta(html, "og:price:amount") ||
    getMeta(html, "twitter:data1");

  if (metaPrice) {
    const n = String(metaPrice).replace(/[^\d.,]/g, "");
    if (n) return n.includes("R$") ? n : `R$ ${n}`;
  }

  const priceMatch = html.match(/R\$\s?[\d.]+,\d{2}/i);
  return priceMatch ? priceMatch[0] : "";
}

function autoCategory(text) {
  const t = String(text || "").toLowerCase();

  if (t.includes("meia") || t.includes("roupa") || t.includes("revenda") || t.includes("atacado")) return "renda-extra";
  if (t.includes("livro") || t.includes("curso") || t.includes("educação") || t.includes("financeira")) return "financas";
  if (t.includes("programação") || t.includes("javascript") || t.includes("python") || t.includes("c#") || t.includes("c sharp")) return "programacao";
  if (t.includes("furadeira") || t.includes("ferramenta") || t.includes("trabalho")) return "trabalho";
  if (t.includes("investimento") || t.includes("ações") || t.includes("fii") || t.includes("tesouro")) return "investimentos";
  if (t.includes("planilha") || t.includes("controle") || t.includes("orçamento")) return "financas";

  return "geral";
}

function autoTags(text) {
  const t = String(text || "").toLowerCase();
  const tags = new Set();

  if (t.includes("meia")) ["meia", "revenda", "renda-extra"].forEach(x => tags.add(x));
  if (t.includes("roupa")) ["moda", "vestuario", "revenda"].forEach(x => tags.add(x));
  if (t.includes("furadeira")) ["ferramenta", "trabalho", "casa"].forEach(x => tags.add(x));
  if (t.includes("livro")) ["livro", "educacao", "financas"].forEach(x => tags.add(x));
  if (t.includes("planilha")) ["planilha", "controle-financeiro", "financas"].forEach(x => tags.add(x));
  if (t.includes("programação") || t.includes("javascript")) ["programacao", "tecnologia", "renda-extra"].forEach(x => tags.add(x));
  if (t.includes("investimento")) ["investimentos", "dinheiro", "renda-fixa"].forEach(x => tags.add(x));

  if (!tags.size) {
    tags.add("produto");
    tags.add("recomendado");
  }

  return Array.from(tags);
}

async function fetchProductData(url) {
  try {
    const response = await axios.get(url, {
      timeout: 12000,
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    const html = String(response.data || "");
    const parsed = new URL(url);

    const title = getTitle(html) || `Produto em ${parsed.hostname.replace("www.", "")}`;
    const description = getDescription(html);
    const image = getImage(html, url);
    const price = getPrice(html);

    return {
      title,
      description,
      image,
      price
    };
  } catch {
    const parsed = new URL(url);

    return {
      title: `Produto recomendado - ${parsed.hostname.replace("www.", "")}`,
      description: "Produto recomendado para quem quer melhorar sua renda, organização ou conhecimento.",
      image: "",
      price: ""
    };
  }
}

async function saveLinkFromUrl(url) {
  const product = await fetchProductData(url);
  const baseText = `${product.title} ${product.description} ${url}`;
  const category = autoCategory(baseText);
  const tags = autoTags(baseText);
  const affiliates = readAffiliates();

  const id = `${slugify(product.title)}-${Date.now()}`;

  const item = {
    id,
    title: product.title,
    description: product.description,
    url,
    image: product.image,
    price: product.price,
    badge: "Recomendado",
    category,
    tags,
    active: true,
    source: "telegram",
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

Agora ficou simples:

Envie APENAS o link do produto.
Eu vou tentar identificar automaticamente:

• título
• descrição
• imagem
• preço
• categoria
• tags

Comandos extras:
/list
/stats
/toggle ID
/delete ID
    `.trim());
  });

  bot.on("message", async (msg) => {
    if (!isAdmin(msg)) return;

    const text = msg.text || "";

    if (text.startsWith("/start") || text.startsWith("/help")) return;
    if (text.startsWith("/list") || text.startsWith("/stats") || text.startsWith("/toggle") || text.startsWith("/delete")) return;

    const url = extractFirstUrl(text);

    if (!url) {
      return bot.sendMessage(msg.chat.id, "Envie apenas um link de produto para cadastrar automaticamente.");
    }

    const loading = await bot.sendMessage(msg.chat.id, "🔎 Lendo o link e cadastrando produto...");

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
      bot.sendMessage(msg.chat.id, `❌ Não consegui cadastrar esse link: ${err.message}`);
    }
  });

  bot.onText(/\/list/, (msg) => {
    if (!isAdmin(msg)) return;

    const affiliates = readAffiliates();

    if (!affiliates.length) {
      return bot.sendMessage(msg.chat.id, "Nenhum produto cadastrado.");
    }

    const text = affiliates.slice(0, 20).map((p, i) => {
      return `${i + 1}. ${p.title}
ID: ${p.id}
Categoria: ${p.category}
Cliques: ${p.clicks || 0}
Imagem: ${p.image ? "sim" : "não"}
Ativo: ${p.active ? "sim" : "não"}`;
    }).join("\n\n");

    bot.sendMessage(msg.chat.id, text);
  });

  bot.onText(/\/stats/, (msg) => {
    if (!isAdmin(msg)) return;

    const affiliates = readAffiliates();

    if (!affiliates.length) {
      return bot.sendMessage(msg.chat.id, "Nenhum dado ainda.");
    }

    const sorted = affiliates
      .slice()
      .sort((a, b) => Number(b.clicks || 0) - Number(a.clicks || 0))
      .slice(0, 15);

    const text = sorted.map((p, i) => {
      return `${i + 1}. ${p.title}
Cliques: ${p.clicks || 0}
Categoria: ${p.category}`;
    }).join("\n\n");

    bot.sendMessage(msg.chat.id, `📊 Ranking de cliques:\n\n${text}`);
  });

  bot.onText(/\/toggle\s+(.+)/, (msg, match) => {
    if (!isAdmin(msg)) return;

    const id = match[1].trim();
    const affiliates = readAffiliates();
    const item = affiliates.find(p => p.id === id);

    if (!item) {
      return bot.sendMessage(msg.chat.id, "❌ Produto não encontrado.");
    }

    item.active = !item.active;
    saveAffiliates(affiliates);

    bot.sendMessage(msg.chat.id, `✅ Produto agora está: ${item.active ? "ATIVO" : "INATIVO"}`);
  });

  bot.onText(/\/delete\s+(.+)/, (msg, match) => {
    if (!isAdmin(msg)) return;

    const id = match[1].trim();
    const affiliates = readAffiliates();
    const next = affiliates.filter(p => p.id !== id);

    if (next.length === affiliates.length) {
      return bot.sendMessage(msg.chat.id, "❌ Produto não encontrado.");
    }

    saveAffiliates(next);
    bot.sendMessage(msg.chat.id, "🗑️ Produto removido.");
  });

  bot.on("polling_error", (err) => {
    console.log("Erro polling Telegram:", err.message);
  });

  console.log("🤖 Telegram bot iniciado em modo automático.");

  return bot;
}

if (require.main === module) {
  startTelegramBot();
}

module.exports = {
  startTelegramBot
};
