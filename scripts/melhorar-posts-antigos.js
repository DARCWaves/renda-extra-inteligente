const fs = require("fs");
const path = require("path");

const postsFile = path.join(__dirname, "..", "data", "posts.json");
const auto = require("../autoContent");

function readPosts() {
  if (!fs.existsSync(postsFile)) return [];

  try {
    const raw = fs.readFileSync(postsFile, "utf8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writePosts(posts) {
  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2), "utf8");
}

function isWeakTitle(title) {
  const t = String(title || "").toLowerCase();

  return (
    !t ||
    t.includes("como melhorar sua vida com") ||
    t.includes("aprenda estratégias reais") ||
    t.length < 38
  );
}

const posts = readPosts();
const improved = [];
const usedTitles = new Set();

for (const oldPost of posts) {
  const category = auto.detectCategory(oldPost);
  let title = oldPost.title;

  if (isWeakTitle(title) || usedTitles.has(title)) {
    title = auto.pickTitle(category, improved);
  }

  usedTitles.add(title);

  const newPost = {
    ...oldPost,
    category,
    title,
    description: auto.descriptions[category] || auto.descriptions.financas,
    content: auto.buildContent(category, title),
    seoTitle: `${title} | Renda Extra Inteligente`,
    seoDescription: auto.descriptions[category] || auto.descriptions.financas,
    seoKeywords: `${category}, ganhar dinheiro, renda extra, finanças pessoais, programação para iniciantes, investimentos, economia, trabalho`,
    updatedAt: new Date().toISOString()
  };

  if (!newPost.slug || newPost.slug.includes("como-melhorar-sua-vida-com")) {
    newPost.slug = `${String(title)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}-${Date.now()}-${improved.length}`;
  }

  improved.push(newPost);
}

writePosts(improved);

console.log(`✅ Posts analisados: ${posts.length}`);
console.log(`✅ Posts melhorados: ${improved.length}`);
