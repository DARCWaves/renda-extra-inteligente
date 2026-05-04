const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "data", "affiliate-links.json");

if (!fs.existsSync(FILE)) {
  console.log("Nenhum arquivo de afiliados encontrado.");
  process.exit(0);
}

const raw = fs.readFileSync(FILE, "utf8");
const data = raw.trim() ? JSON.parse(raw) : [];

const limpos = data.filter(item =>
  item &&
  item.url &&
  item.title &&
  item.source === "telegram_link" &&
  item.createdBy === "telegram_bot"
);

fs.writeFileSync(FILE, JSON.stringify(limpos, null, 2), "utf8");

console.log(`✅ Limpeza concluída.`);
console.log(`Antes: ${data.length}`);
console.log(`Depois: ${limpos.length}`);
console.log("Agora só ficam produtos criados pelo bot via link direto.");
