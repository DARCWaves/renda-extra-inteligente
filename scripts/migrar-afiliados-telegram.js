const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "data", "affiliate-links.json");

function ensureFile() {
  const dir = path.dirname(FILE);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify([], null, 2), "utf8");
  }
}

ensureFile();

const raw = fs.readFileSync(FILE, "utf8");
const data = raw.trim() ? JSON.parse(raw) : [];

const migrated = data.map(item => {
  return {
    ...item,
    source: item.source || "telegram",
    active: item.active !== false,
    badge: item.badge || "Recomendado",
    image: item.image || "",
    price: item.price || "",
    createdAt: item.createdAt || new Date().toISOString()
  };
});

fs.writeFileSync(FILE, JSON.stringify(migrated, null, 2), "utf8");

console.log(`✅ ${migrated.length} afiliados migrados para source=telegram.`);
