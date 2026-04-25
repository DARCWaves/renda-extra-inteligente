const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "data", "posts.json");

function readPosts() {
  try {
    if (!fs.existsSync(FILE)) return [];
    const raw = fs.readFileSync(FILE, "utf8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writePosts(posts) {
  fs.writeFileSync(FILE, JSON.stringify(posts, null, 2), "utf8");
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateContent(topic) {
  return `
${topic} é um tema essencial para quem quer melhorar a vida financeira sem cair em promessa fácil.

O primeiro passo é entender sua realidade: quanto entra, quanto sai e quais gastos estão drenando seu dinheiro.

Depois vem a estratégia. Cortar excessos, criar reserva de emergência e buscar renda extra com baixo custo inicial.

Em momentos de juros altos, inflação pressionada ou dólar instável, tomar decisões com base em dados se torna ainda mais importante.

A verdade é simples: dinheiro cresce quando existe controle, constância e direção.

Este conteúdo é educativo e não representa recomendação financeira individual.
`;
}

function generateAutoPost(topic = "finanças pessoais") {
  const posts = readPosts();

  const title = `Como melhorar sua vida financeira com ${topic}`;
  const slugBase = slugify(title);
  const exists = posts.some((p) => p.slug === slugBase);
  const slug = exists ? `${slugBase}-${Date.now()}` : slugBase;

  const post = {
    title,
    slug,
    category: "financas",
    description: `Entenda como ${topic} pode ajudar você a tomar decisões melhores com dinheiro.`,
    content: generateContent(topic),
    createdAt: new Date().toISOString(),
    seoTitle: `${title} | Renda Extra Inteligente`,
    seoDescription: `Guia educativo sobre ${topic}, renda extra, economia e organização financeira.`,
    seoKeywords: `${topic}, finanças, renda extra, dinheiro, investimentos`
  };

  posts.unshift(post);
  writePosts(posts);

  return post;
}

module.exports = {
  generateAutoPost
};
