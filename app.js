
require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

// =============================
// CONFIG BASE
// =============================
const PORT = process.env.PORT || 3000;
const BASE_URL = "https://renda-extra-inteligente.onrender.com";

// =============================
// MIDDLEWARES
// =============================
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// =============================
// FUNÇÃO PARA LER POSTS
// =============================
function getPosts() {
  const file = path.join(__dirname, "data/posts.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file));
}

// =============================
// HOME
// =============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/home.html"));
});

// =============================
// POSTS
// =============================
app.get("/post/:slug", (req, res) => {
  const posts = getPosts();
  const post = posts.find(p => p.slug === req.params.slug);

  if (!post) {
    return res.status(404).send("Post não encontrado");
  }

  res.send(`
  <!DOCTYPE html>
  <html lang="pt-br">
  <head>
    <title>${post.title}</title>
    <meta name="description" content="${post.description}">
    <link rel="canonical" href="${BASE_URL}/post/${post.slug}">
  </head>
  <body>
    <h1>${post.title}</h1>
    <p>${post.content}</p>
  </body>
  </html>
  `);
});

// =============================
// LISTAGEM
// =============================
app.get("/posts", (req, res) => {
  const posts = getPosts();

  let html = "<h1>Conteúdos</h1>";

  posts.forEach(p => {
    html += `<a href="/post/${p.slug}">${p.title}</a><br>`;
  });

  res.send(html);
});

// =============================
// ROBOTS.TXT
// =============================
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");

  res.send(`
User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
  `);
});

// =============================
// SITEMAP XML (CORRETO)
// =============================
app.get("/sitemap.xml", (req, res) => {
  const posts = getPosts();

  let urls = `
<url>
  <loc>${BASE_URL}/</loc>
  <changefreq>daily</changefreq>
  <priority>1.0</priority>
</url>

<url>
  <loc>${BASE_URL}/posts</loc>
  <changefreq>daily</changefreq>
  <priority>0.9</priority>
</url>
`;

  posts.forEach(post => {
    urls += `
<url>
  <loc>${BASE_URL}/post/${post.slug}</loc>
  <lastmod>${new Date(post.createdAt || Date.now()).toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
</url>
`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
});

// =============================
// PROTEÇÃO CONTRA HTML NO XML
// =============================
app.use((req, res, next) => {
  if (req.url.includes(".xml")) {
    res.set("Content-Type", "application/xml");
  }
  next();
});

// =============================
// 404 SEGURO
// =============================
app.use((req, res) => {
  res.status(404).send("Página não encontrada");
});

// =============================
// START
// =============================
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});

