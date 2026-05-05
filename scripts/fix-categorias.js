const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "data", "posts.json");

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeCategory(category, title = "") {
  const raw = normalizeText(category);
  const t = normalizeText(title);

  const joined = `${raw} ${t}`;

  if (
    joined.includes("program") ||
    joined.includes("javascript") ||
    joined.includes("codigo") ||
    joined.includes("site") ||
    joined.includes("app")
  ) return "programacao";

  if (
    joined.includes("renda extra") ||
    joined.includes("ganhar dinheiro") ||
    joined.includes("vender") ||
    joined.includes("celular")
  ) return "renda-extra";

  if (
    joined.includes("invest") ||
    joined.includes("fii") ||
    joined.includes("tesouro") ||
    joined.includes("acoes")
  ) return "investimentos";

  if (
    joined.includes("trabalho") ||
    joined.includes("emprego") ||
    joined.includes("habilidade")
  ) return "trabalho";

  if (
    joined.includes("dolar") ||
    joined.includes("selic") ||
    joined.includes("inflacao") ||
    joined.includes("economia")
  ) return "economia";

  if (
    joined.includes("financa") ||
    joined.includes("dinheiro") ||
    joined.includes("salario") ||
    joined.includes("gasto") ||
    joined.includes("divida") ||
    joined.includes("organizar")
  ) return "financas";

  if (raw === "finanças") return "financas";
  if (raw === "renda") return "renda-extra";
  if (raw === "programação") return "programacao";

  return raw || "financas";
}

if (!fs.existsSync(file)) {
  console.log("⚠️ data/posts.json não encontrado.");
  process.exit(0);
}

const raw = fs.readFileSync(file, "utf8");
const posts = raw.trim() ? JSON.parse(raw) : [];

const fixed = posts.map((post) => {
  const category = normalizeCategory(post.category, post.title);

  return {
    ...post,
    category,
    status: post.status || "published",
    updatedAt: post.updatedAt || new Date().toISOString()
  };
});

fs.writeFileSync(file, JSON.stringify(fixed, null, 2), "utf8");

const count = fixed.reduce((acc, post) => {
  acc[post.category] = (acc[post.category] || 0) + 1;
  return acc;
}, {});

console.log("✅ Categorias corrigidas:");
console.log(count);
