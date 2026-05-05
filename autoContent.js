const fs = require("fs");
const path = require("path");

const postsFile = path.join(__dirname, "data", "posts.json");
const stateFile = path.join(__dirname, "data", "auto-post-state.json");

const {
  categories,
  normalizeCategory,
  pickNewTitle,
  buildDescription,
  buildContent,
  makeSignature,
  normalizeText,
  slugify
} = require("./services/contentStrategyService");

function ensureFiles() {
  const dir = path.dirname(postsFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(postsFile)) fs.writeFileSync(postsFile, JSON.stringify([], null, 2), "utf8");
  if (!fs.existsSync(stateFile)) fs.writeFileSync(stateFile, JSON.stringify({ index: 0 }, null, 2), "utf8");
}

function readJson(file, fallback) {
  ensureFiles();
  try {
    const raw = fs.readFileSync(file, "utf8");
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureFiles();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function getNextCategory() {
  const state = readJson(stateFile, { index: 0 });
  const index = Number(state.index || 0);
  const category = categories[index % categories.length];

  writeJson(stateFile, {
    index: index + 1,
    lastCategory: category,
    updatedAt: new Date().toISOString()
  });

  return normalizeCategory(category);
}

function generatePost() {
  const posts = readJson(postsFile, []);
  const category = getNextCategory();

  const usedTitles = new Set(posts.map(p => normalizeText(p.title)));
  const usedSlugs = new Set(posts.map(p => p.slug).filter(Boolean));
  const usedSignatures = new Set(posts.map(p => p.contentSignature).filter(Boolean));

  const title = pickNewTitle(category, usedTitles);

  let slug = slugify(title);
  const baseSlug = slug;
  let attempt = 1;

  while (usedSlugs.has(slug)) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  let content = "";
  let signature = "";

  for (let variant = 0; variant < 30; variant++) {
    content = buildContent(category, title, variant);
    signature = makeSignature(content);
    if (!usedSignatures.has(signature)) break;
  }

  const post = {
    slug,
    category,
    title,
    description: buildDescription(category, title),
    content,
    seoTitle: `${title} | Renda Extra Inteligente`,
    seoDescription: buildDescription(category, title),
    seoKeywords: `${category}, dinheiro, renda extra, finanças pessoais, programação para iniciantes, investimentos, economia, trabalho`,
    status: "published",
    contentSignature: signature,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  posts.unshift(post);
  writeJson(postsFile, posts.slice(0, 300));

  console.log("✅ Post automático criado:", post.title);
  return post;
}

function runAutoPost() {
  return generatePost();
}

module.exports = { runAutoPost, generatePost };
