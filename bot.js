require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.TELEGRAM_TOKEN;
const BASE_URL = process.env.BASE_URL;

const bot = new TelegramBot(TOKEN, { polling: true });

const DB_PATH = path.join(__dirname, "data", "products.json");

// Garante que pasta existe
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"));
}

// Cria banco se não existir
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
}

function loadProducts() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function saveProducts(products) {
  fs.writeFileSync(DB_PATH, JSON.stringify(products, null, 2));
}

/*
==================================================
START
==================================================
*/

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `
🚀 Renda Extra Inteligente BOT

Comandos disponíveis:

/add → adicionar produto
/list → listar produtos
/link ID → gerar link rastreável
/stats → ver cliques

Exemplo:
/link planilha-financeira
`);
});

/*
==================================================
ADICIONAR PRODUTO
==================================================
*/

let userState = {};

bot.onText(/\/add/, (msg) => {
  userState[msg.chat.id] = { step: "nome" };
  bot.sendMessage(msg.chat.id, "📦 Nome do produto:");
});

bot.on("message", (msg) => {
  const state = userState[msg.chat.id];
  if (!state) return;

  const text = msg.text;

  if (state.step === "nome") {
    state.nome = text;
    state.step = "link";
    return bot.sendMessage(msg.chat.id, "🔗 Link de afiliado:");
  }

  if (state.step === "link") {
    state.link = text;
    state.step = "categoria";
    return bot.sendMessage(msg.chat.id, "📂 Categoria:");
  }

  if (state.step === "categoria") {
    const products = loadProducts();

    const id = state.nome
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    products.push({
      id,
      nome: state.nome,
      link: state.link,
      categoria: text,
      clicks: 0,
      ativo: true
    });

    saveProducts(products);
    delete userState[msg.chat.id];

    return bot.sendMessage(msg.chat.id, `✅ Produto salvo com ID: ${id}`);
  }
});

/*
==================================================
LISTAR PRODUTOS
==================================================
*/

bot.onText(/\/list/, (msg) => {
  const products = loadProducts();

  if (products.length === 0) {
    return bot.sendMessage(msg.chat.id, "Nenhum produto cadastrado.");
  }

  let response = "📦 PRODUTOS:\n\n";

  products.forEach((p) => {
    response += `
ID: ${p.id}
Nome: ${p.nome}
Categoria: ${p.categoria}
Cliques: ${p.clicks}
---------------------
`;
  });

  bot.sendMessage(msg.chat.id, response);
});

/*
==================================================
GERAR LINK COM TRACKING
==================================================
*/

bot.onText(/\/link (.+)/, (msg, match) => {
  const id = match[1];
  const products = loadProducts();

  const product = products.find(p => p.id === id);

  if (!product) {
    return bot.sendMessage(msg.chat.id, "❌ Produto não encontrado");
  }

  const trackingLink = `${BASE_URL}/out/${product.id}`;

  bot.sendMessage(msg.chat.id, `
🔗 Link rastreável:

${trackingLink}

📊 Use esse link para divulgar.
`);
});

/*
==================================================
STATS
==================================================
*/

bot.onText(/\/stats/, (msg) => {
  const products = loadProducts();

  let response = "📊 RELATÓRIO DE CLIQUES:\n\n";

  products.forEach(p => {
    response += `
${p.nome}
Cliques: ${p.clicks}
`;
  });

  bot.sendMessage(msg.chat.id, response);
});

/*
==================================================
LOG
==================================================
*/

console.log("🤖 Bot rodando...");
