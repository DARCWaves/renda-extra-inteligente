require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = String(process.env.TELEGRAM_CHAT_ID || "");
const BASE_URL = process.env.BASE_URL || process.env.SITE_URL || "http://localhost:3000";

const FILE = path.join(__dirname, "data", "affiliate-links.json");

function ensureFile() {
  const dir = path.join(__dirname, "data");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
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
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function autoCategory(text) {
  const t = String(text).toLowerCase();

  if (t.includes("meia") || t.includes("roupa") || t.includes("revenda")) return "renda-extra";
  if (t.includes("livro") || t.includes("curso") || t.includes("educação")) return "investimentos";
  if (t.includes("furadeira") || t.includes("ferramenta") || t.includes("trabalho")) return "trabalho";
  if (t.includes("planilha") || t.includes("controle") || t.includes("financeiro")) return "financas";

  return "geral";
}

function autoTags(text) {
  const t = String(text).toLowerCase();
  const tags = new Set();

  if (t.includes("meia")) ["meia", "revenda", "renda-extra"].forEach(x => tags.add(x));
  if (t.includes("roupa")) ["moda", "vestuario", "revenda"].forEach(x => tags.add(x));
  if (t.includes("furadeira")) ["ferramenta", "trabalho", "casa"].forEach(x => tags.add(x));
  if (t.includes("livro")) ["livro", "educacao", "financas"].forEach(x => tags.add(x));
  if (t.includes("planilha")) ["planilha", "controle-financeiro", "financas"].forEach(x => tags.add(x));
  if (t.includes("investimento")) ["investimentos", "dinheiro", "renda-fixa"].forEach(x => tags.add(x));

  if (!tags.size) {
    tags.add("produto");
    tags.add("geral");
  }

  return Array.from(tags);
}

function isAdmin(msg) {
  if (!ADMIN_CHAT_ID) return true;
  return String(msg.chat.id) === ADMIN_CHAT_ID;
}

function startTelegramBot() {
  if (!TOKEN) {
    console.log("⚠️ TELEGRAM_BOT_TOKEN não configurado.");
    return null;
  }

  if (global.__TELEGRAM_BOT_STARTED__) {
    return null;
  }

  global.__TELEGRAM_BOT_STARTED__ = true;

  const bot = new TelegramBot(TOKEN, { polling: true });

  bot.onText(/\/start|\/help/, (msg) => {
    if (!isAdmin(msg)) return;

    bot.sendMessage(msg.chat.id, `
🤖 Renda Extra Inteligente Bot

Comandos:

/link Título | URL | Categoria | Descrição | Preço

Exemplo:
/link Kit de meias para revenda | https://seulink.com | renda-extra | Produto barato para começar revenda | R$ 29,90

/list
/stats
/toggle ID
/delete ID
    `.trim());
  });

  bot.onText(/\/link(?:\s+(.+))?/, (msg, match) => {
    if (!isAdmin(msg)) return;

    const input = match[1];

    if (!input) {
      return bot.sendMessage(msg.chat.id, `
Envie assim:

/link Título | URL | Categoria | Descrição | Preço

Exemplo:
/link Livro de educação financeira | https://seulink.com | investimentos | Material para iniciantes | R$ 39,90
      `.trim());
    }

    const parts = input.split("|").map(p => p.trim());

    const title = parts[0];
    const url = parts[1];
    const categoryInput = parts[2];
    const description = parts[3] || "Produto recomendado para quem busca melhorar sua vida financeira.";
    const price = parts[4] || "";

    if (!title || !url) {
      return bot.sendMessage(msg.chat.id, "❌ Formato inválido. Use: /link Título | URL | Categoria | Descrição | Preço");
    }

    const baseText = `${title} ${description} ${categoryInput || ""}`;
    const category = categoryInput || autoCategory(baseText);
    const tags = autoTags(baseText);

    const affiliates = readAffiliates();

    const id = `${slugify(title)}-${Date.now()}`;

    const item = {
      id,
      title,
      description,
      url,
      image: "",
      price,
      badge: "💡 Recomendado",
      category,
      tags,
      active: true,
      clicks: 0,
      createdAt: new Date().toISOString()
    };

    affiliates.unshift(item);
    saveAffiliates(affiliates);

    bot.sendMessage(msg.chat.id, `
✅ Link salvo com sucesso!

📦 ${title}
🆔 ${id}
📂 ${category}
🏷️ ${tags.join(", ")}

🔗 Link rastreável:
${BASE_URL}/out/${id}
    `.trim());
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

  console.log("🤖 Telegram bot iniciado.");

  return bot;
}

if (require.main === module) {
  startTelegramBot();
}

module.exports = {
  startTelegramBot
};
