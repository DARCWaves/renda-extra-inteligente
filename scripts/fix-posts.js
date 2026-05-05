const fs = require("fs");
const path = require("path");

const {
  slugify,
  detectCategory,
  generateContent,
  signature
} = require("../services/contentStrategyService");

const FILE = path.join(__dirname, "../data/posts.json");

const posts = JSON.parse(fs.readFileSync(FILE));

const updated = posts.map((p, i) => {
  const category = detectCategory(p.title);

  const content = generateContent(category, p.title);

  return {
    ...p,
    slug: slugify(p.title + "-" + i),
    category,
    description: p.title,
    content,
    contentSignature: signature(content)
  };
});

fs.writeFileSync(FILE, JSON.stringify(updated, null, 2));

console.log("🔥 TODOS OS POSTS FORAM REESCRITOS COM SEO FORTE");
