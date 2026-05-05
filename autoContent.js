const fs = require("fs");
const path = require("path");

const {
  CATEGORY_ORDER,
  normalizeText,
  normalizeCategory,
  slugify,
  pickTitle,
  buildDescription,
  buildContent,
  contentSignature
} = require("./services/contentStrategyService");

const postsFile = path.join(__dirname, "data", "posts.json");
const stateFile = path.join(__dirname, "data", "auto-post-state.json");

function ensureFiles() {
  const dir = path.dirname(postsFile);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(postsFile)) {
    fs.writeFileSync(postsFile, JSON.stringify([], null, 2), "utf8");
  }

  if (!fs.existsSync(stateFile)) {
    fs.writeFileSync(stateFile, JSON.stringify({ index: 0 }, null, 2), "utf8");
  }
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
  const category = CATEGORY_ORDER[index % CATEGORY_ORDER.length];

  writeJson(stateFile, {
    index: index + 1,
    lastCategory: category,
    updatedAt: new Date().toISOString()
  });

  return category;
}

function buildUniqueSlug(title, usedSlugs) {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

function generatePost() {
  const posts = readJson(postsFile, []);
  const category = getNextCategory();

  const usedTitles = new Set(posts.map((post) => normalizeText(post.title)));
  const usedSlugs = new Set(posts.map((post) => post.slug).filter(Boolean));

  const title = pickTitle(category, usedTitles);
  const slug = buildUniqueSlug(title, usedSlugs);
  const description = buildDescription(category, title);
  const content = buildContent(category, title);

  const post = {
    slug,
    title,
    category: normalizeCategory(category, title, content),
    description,
    seoTitle: `${title} | Renda Extra Inteligente`,
    seoDescription: description,
    seoKeywords: `${category}, finanças pessoais, renda extra, programação para iniciantes, investimentos, trabalho, economia, dinheiro`,
    content,
    contentSignature: contentSignature(content),
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  posts.unshift(post);
  writeJson(postsFile, posts.slice(0, 500));

  console.log("✅ Post automático criado:", post.category, "-", post.title);

  return post;
}

function runAutoPost() {
  return generatePost();
}

module.exports = {
  runAutoPost,
  generatePost
};
