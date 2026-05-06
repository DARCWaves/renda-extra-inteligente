require("dotenv").config();

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const TelegramBot = require("node-telegram-bot-api");

const ROOT = path.join(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data", "affiliates.json");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = String(process.env.TELEGRAM_CHAT_ID || "");

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf8");
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function normalizeUrl(text) {
  const match = String(text || "").match(/https?:\/\/[^\s]+/i);
  return match ? match[0].trim() : null;
}

function isAdmin(msg) {
  if (!ADMIN_CHAT_ID) return true;
  return String(msg.chat.id) === ADMIN_CHAT_ID;
}

function fetchHtml(url) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith("https") ? https : http;

      const req = lib.get(
        url,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 RendaExtraBot/1.0",
            "Accept": "text/html,application/xhtml+xml"
          },
          timeout: 12000
        },
        (res) => {
          let data = "";
          res.on("data", chunk => {
            data += chunk;
            if (data.length > 900000) req.destroy();
          });
          res.on("end", () => resolve(data));
        }
      );

      req.on("error", () => resolve(""));
      req.on("timeout", () => {
        req.destroy();
        resolve("");
      });
    } catch {
      resolve("");
    }
  });
}

function extractMeta(html, url) {
  function find(regex) {
    const match = html.match(regex);
    return match ? String(match[1] || "").replace(/\s+/g, " ").trim() : "";
  }

  const title =
    find(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    find(/<title[^>]*>([^<]+)<\/title>/i) ||
    "Produto recomendado";

  const image =
    find(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    find(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
    "";

  const description =
    find(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
    find(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    "Oferta selecionada para ajudar quem busca economizar e comprar melhor.";

  const price =
    find(/"price"\s*:\s*"?([0-9]+(?:[.,][0-9]{2})?)"?/i) ||
    find(/R\$\s?([0-9\.\,]+)/i);

  let category = "ofertas";
  const lower = `${title} ${description} ${url}`.toLowerCase();

  if (lower.includes("livro") || lower.includes("educação") || lower.includes("curso")) category = "educacao";
  if (lower.includes("notebook") || lower.includes("computador") || lower.includes("teclado")) category = "tecnologia";
  if (lower.includes("planilha") || lower.includes("controle financeiro")) category = "financas";
  if (lower.includes("academia") || lower.includes("fitness") || lower.includes("top")) category = "fitness";

  return {
    title: title.slice(0, 140),
    description: description.slice(0, 220),
    image,
    price: price ? `R$ ${price}` : "",
    category
  };
}

function saveAffiliate(product) {
  const items = readJson(DATA_FILE, []);

  const exists = items.find(item => item.originalUrl === product.originalUrl);

  if (exists) {
    Object.assign(exists, product, {
      updatedAt: new Date().toISOString(),
      active: true
    });
  } else {
    items.unshift({
      id: `aff-${Date.now()}`,
      active: true,
      clicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...product
    });
  }

  writeJson(DATA_FILE, items.slice(0, 200));
  return exists || items[0];
}

async function startAffiliateBot() {
  if (!TOKEN) {
    console.log("Affiliate Bot: TELEGRAM_BOT_TOKEN não configurado.");
    return;
  }

  const bot = new TelegramBot(TOKEN, {
    polling: {
      interval: 1000,
      autoStart: true,
      params: {
        timeout: 10
      }
    }
  });

  bot.on("polling_error", (err) => {
    console.error("Affiliate Bot polling_error:", err.message);
  });

  bot.onText(/\/start|start|START/i, (msg) => {
    if (!isAdmin(msg)) return;
    bot.sendMessage(
      msg.chat.id,
      "✅ Bot de afiliados ativo.\n\nEnvie um link de produto para cadastrar automaticamente no site."
    );
  });

  bot.onText(/\/status|status/i, (msg) => {
    if (!isAdmin(msg)) return;
    const items = readJson(DATA_FILE, []);
    bot.sendMessage(msg.chat.id, `✅ Bot de afiliados online.\nProdutos cadastrados: ${items.length}`);
  });

  bot.on("message", async (msg) => {
    if (!isAdmin(msg)) return;

    const text = String(msg.text || "");
    if (/^\/start|^start$|^START$|^\/status|^status$/i.test(text.trim())) return;

    const url = normalizeUrl(text);

    if (!url) {
      return bot.sendMessage(msg.chat.id, "Envie um link real de produto para cadastrar.");
    }

    const loading = await bot.sendMessage(msg.chat.id, "🔎 Lendo produto e cadastrando...");

    const html = await fetchHtml(url);
    const meta = extractMeta(html, url);

    const saved = saveAffiliate({
      originalUrl: url,
      url,
      badge: "Recomendado",
      title: meta.title,
      description: meta.description,
      image: meta.image,
      imageUrl: meta.image,
      price: meta.price,
      category: meta.category
    });

    await bot.sendMessage(
      msg.chat.id,
      `✅ Produto cadastrado automaticamente.\n\nProduto:\n${saved.title}\n\nCategoria:\n${saved.category}\n\nPreço:\n${saved.price || "Não encontrado"}\n\nImagem:\n${saved.image ? "Encontrada" : "Não encontrada"}\n\nLink:\n${saved.url}`
    ).catch(() => {});

    bot.deleteMessage(msg.chat.id, loading.message_id).catch(() => {});
  });

  console.log("✅ Affiliate Telegram Bot iniciado.");
}

if (require.main === module) {
  startAffiliateBot();
}

module.exports = { startAffiliateBot };
