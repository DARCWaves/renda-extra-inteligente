const fs = require("fs");
const path = require("path");

const postsFile = path.join(__dirname, "..", "data", "posts.json");

const {
  normalizeText,
  normalizeCategory,
  detectCategoryFromTitle,
  improveTitle,
  buildContent,
  makeSignature,
  slugify,
  descriptions
} = require("../services/contentStrategyService");

const raw = fs.existsSync(postsFile) ? fs.readFileSync(postsFile, "utf8") : "[]";
const posts = raw.trim() ? JSON.parse(raw) : [];

const usedTitles = new Set();
const usedSlugs = new Set();
const usedSignatures = new Set();

const improved = posts.map((oldPost, index) => {
  const category = normalizeCategory(oldPost.category || detectCategoryFromTitle(oldPost.title));
  const title = improveTitle(oldPost.title, category, usedTitles);
  usedTitles.add(normalizeText(title));

  let slug = oldPost.slug || slugify(title);

  if (!slug || slug.includes("draft") || slug.includes("como-melhorar-sua-vida-com")) {
    slug = slugify(title);
  }

  const baseSlug = slug;
  let attempt = 1;

  while (usedSlugs.has(slug)) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  usedSlugs.add(slug);

  let content = "";
  let signature = "";

  for (let variant = 0; variant < 20; variant++) {
    content = buildContent(category, title, index + variant);
    signature = makeSignature(content);
    if (!usedSignatures.has(signature)) break;
  }

  usedSignatures.add(signature);

  return {
    ...oldPost,
    slug,
    title,
    category,
    description: descriptions[category] || descriptions.financas,
    content,
    seoTitle: `${title} | Renda Extra Inteligente`,
    seoDescription: descriptions[category] || descriptions.financas,
    seoKeywords: `${category}, dinheiro, renda extra, finanças pessoais, programação para iniciantes, investimentos, economia, trabalho`,
    status: "published",
    contentSignature: signature,
    updatedAt: new Date().toISOString(),
    createdAt: oldPost.createdAt || new Date().toISOString()
  };
});

fs.writeFileSync(postsFile, JSON.stringify(improved, null, 2), "utf8");

console.log(`✅ Posts antigos reescritos: ${improved.length}`);
