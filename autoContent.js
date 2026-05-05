const fs = require("fs");
const path = require("path");

const {
  slugify,
  detectCategory,
  generateTitle,
  generateContent,
  signature
} = require("./services/contentStrategyService");

const FILE = path.join(__dirname, "data/posts.json");

function read() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function runAutoPost() {
  const posts = read();

  const title = generateTitle("financas");
  const category = detectCategory(title);
  const content = generateContent(category, title);

  const post = {
    slug: slugify(title + Date.now()),
    title,
    category,
    description: title,
    content,
    contentSignature: signature(content),
    createdAt: new Date().toISOString()
  };

  posts.unshift(post);
  save(posts);

  console.log("✅ Novo post criado:", title);
}

module.exports = { runAutoPost };
