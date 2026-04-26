const fs = require("fs");
const path = require("path");

const postsFile = path.join(__dirname, "data/posts.json");

// categorias com prioridade
const categories = [
  { name: "renda-extra", weight: 4 },
  { name: "investimentos", weight: 3 },
  { name: "conteudos", weight: 3 },
  { name: "trabalho", weight: 2 },
  { name: "noticias", weight: 1 }
];

// escolher categoria com peso
function pickCategory() {
  const pool = [];

  categories.forEach(cat => {
    for (let i = 0; i < cat.weight; i++) {
      pool.push(cat.name);
    }
  });

  return pool[Math.floor(Math.random() * pool.length)];
}

// gerar conteúdo fake (depois ligamos com IA real)
function generateContent(category) {
  const base = {
    title: "",
    description: "",
    content: "",
    seoKeywords: ""
  };

  const time = Date.now();

  base.title = `Como melhorar sua vida com ${category}`;
  base.description = `Aprenda estratégias reais sobre ${category} e como aplicar no dia a dia.`;

  base.content = `
${category.toUpperCase()} é uma das áreas mais importantes hoje.

Se você quer crescer, precisa entender:
- como funciona
- como aplicar
- como ganhar dinheiro com isso

Dica prática:
Comece pequeno, mas com consistência.

Isso aqui não é promessa fácil.
É estratégia real.
`;

  base.seoKeywords = `${category}, dinheiro, renda extra, ganhar dinheiro`;

  return {
    slug: `${category}-${time}`,
    category,
    ...base,
    createdAt: new Date().toISOString()
  };
}

// salvar post
function savePost(post) {
  let posts = [];

  if (fs.existsSync(postsFile)) {
    posts = JSON.parse(fs.readFileSync(postsFile));
  }

  posts.unshift(post);

  fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2));
}

// execução principal
function runAutoPost() {
  const category = pickCategory();
  const post = generateContent(category);

  savePost(post);

  console.log("Post criado:", post.title);
}

module.exports = { runAutoPost };
