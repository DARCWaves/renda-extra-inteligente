const fs = require("fs");
const path = require("path");

const BASE_URL = "https://renda-extra-inteligente.onrender.com";
const postsFile = path.join(__dirname, "..", "data", "posts.json");
const publicDir = path.join(__dirname, "..", "public");

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

function esc(v) {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

let posts = [];

try {
  if (fs.existsSync(postsFile)) {
    const raw = fs.readFileSync(postsFile, "utf8");
    posts = raw.trim() ? JSON.parse(raw) : [];
  }
} catch {
  posts = [];
}

const urls = [];

function add(loc, priority = "0.8") {
  urls.push(`  <url>
    <loc>${esc(loc)}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`);
}

add(`${BASE_URL}/`, "1.0");
add(`${BASE_URL}/posts`, "0.9");
add(`${BASE_URL}/categoria/financas`, "0.8");
add(`${BASE_URL}/categoria/renda-extra`, "0.8");
add(`${BASE_URL}/categoria/programacao`, "0.8");
add(`${BASE_URL}/categoria/investimentos`, "0.8");
add(`${BASE_URL}/indicadores`, "0.7");

posts
  .filter(p => p && p.slug && p.title && String(p.status || "published") !== "draft")
  .forEach(p => add(`${BASE_URL}/post/${encodeURIComponent(p.slug)}`, "0.75"));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml, "utf8");

fs.writeFileSync(path.join(publicDir, "robots.txt"), `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`, "utf8");

console.log("✅ sitemap.xml e robots.txt gerados em /public");
