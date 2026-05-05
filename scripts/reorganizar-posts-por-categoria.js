const fs = require("fs");
const path = require("path");

const {
  normalizeCategory,
  buildDescription,
  contentSignature
} = require("../services/contentStrategyService");

const file = path.join(__dirname, "..", "data", "posts.json");

if (!fs.existsSync(file)) {
  console.log("⚠️ data/posts.json não encontrado.");
  process.exit(0);
}

const raw = fs.readFileSync(file, "utf8");
const posts = raw.trim() ? JSON.parse(raw) : [];

if (!Array.isArray(posts)) {
  console.error("❌ data/posts.json não é um array.");
  process.exit(1);
}

const fixed = posts.map((post) => {
  const category = normalizeCategory(post.category, post.title, post.content);
  const description = post.description && !String(post.description).includes("Aprenda caminhos práticos para criar renda extra")
    ? post.description
    : buildDescription(category, post.title);

  return {
    ...post,
    category,
    description,
    seoDescription: post.seoDescription || description,
    seoTitle: post.seoTitle || `${post.title} | Renda Extra Inteligente`,
    status: post.status || "published",
    contentSignature: post.contentSignature || contentSignature(post.content || post.title || ""),
    updatedAt: new Date().toISOString()
  };
});

fs.writeFileSync(file, JSON.stringify(fixed, null, 2), "utf8");

const report = fixed.reduce((acc, post) => {
  acc[post.category] = (acc[post.category] || 0) + 1;
  return acc;
}, {});

console.log("✅ Posts reorganizados por categoria:");
console.log(report);
