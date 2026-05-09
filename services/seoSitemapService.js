const { readJson, ROOT } = require("./storageAdapter");

const DEFAULT_BASE_URL = "https://renda-extra-inteligente.onrender.com";

function getBaseUrl() {
  return String(process.env.BASE_URL || process.env.SITE_URL || DEFAULT_BASE_URL)
    .trim()
    .replace(/\/+$/, "");
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function readPostsSafe() {
  return readJson("posts", []);
}

function cleanSlug(slug) {
  return String(slug || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/^post\//, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

function normalizeDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function isValidPost(post) {
  if (!post || typeof post !== "object") return false;

  const slug = cleanSlug(post.slug);
  const title = String(post.title || "").trim();
  const status = String(post.status || "published").toLowerCase();

  if (!slug) return false;
  if (!title) return false;
  if (status === "draft") return false;
  if (slug.includes("draft")) return false;
  if (slug.includes("undefined")) return false;
  if (slug.includes("null")) return false;
  if (slug.includes("post?id")) return false;

  return true;
}

function canonicalKey(slug) {
  return cleanSlug(slug)
    .replace(/-\d{8,}$/g, "")
    .replace(/-\d+$/g, "");
}

function addUrl(urls, seen, loc, options = {}) {
  if (!loc || seen.has(loc)) return;

  seen.add(loc);

  const lastmod = options.lastmod
    ? `\n    <lastmod>${escapeXml(normalizeDate(options.lastmod))}</lastmod>`
    : "";

  const changefreq = options.changefreq
    ? `\n    <changefreq>${escapeXml(options.changefreq)}</changefreq>`
    : "";

  const priority = options.priority
    ? `\n    <priority>${escapeXml(options.priority)}</priority>`
    : "";

  urls.push(`  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod}${changefreq}${priority}
  </url>`);
}

function generateSitemapXml() {
  const baseUrl = getBaseUrl();
  const posts = readPostsSafe();

  const urls = [];
  const seen = new Set();

  [
    ["/", "daily", "1.0"],
    ["/posts", "daily", "0.9"],
    ["/categoria/financas", "weekly", "0.8"],
    ["/categoria/renda-extra", "weekly", "0.8"],
    ["/categoria/programacao", "weekly", "0.8"],
    ["/categoria/investimentos", "weekly", "0.8"],
    ["/categoria/trabalho", "weekly", "0.7"],
    ["/categoria/economia", "weekly", "0.7"],
    ["/indicadores", "daily", "0.8"],
    ["/ofertas", "weekly", "0.6"],
    ["/sobre", "monthly", "0.4"],
    ["/contato", "monthly", "0.4"],
    ["/privacidade", "monthly", "0.3"],
    ["/termos", "monthly", "0.3"],
    ["/editorial", "monthly", "0.4"],
    ["/transparencia", "monthly", "0.4"]
  ].forEach(([url, changefreq, priority]) => {
    addUrl(urls, seen, `${baseUrl}${url}`, { changefreq, priority });
  });

  const bestPosts = new Map();

  posts.filter(isValidPost).forEach((post) => {
    const slug = cleanSlug(post.slug);
    const key = canonicalKey(slug);

    if (!bestPosts.has(key)) {
      bestPosts.set(key, post);
      return;
    }

    const current = bestPosts.get(key);
    const currentTime = new Date(current.updatedAt || current.createdAt || 0).getTime();
    const nextTime = new Date(post.updatedAt || post.createdAt || 0).getTime();

    if (nextTime > currentTime) bestPosts.set(key, post);
  });

  Array.from(bestPosts.values()).forEach((post) => {
    const slug = cleanSlug(post.slug);

    addUrl(urls, seen, `${baseUrl}/post/${encodeURIComponent(slug)}`, {
      lastmod: post.updatedAt || post.createdAt || new Date().toISOString(),
      changefreq: "weekly",
      priority: "0.75"
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}

function generateRobotsTxt() {
  const baseUrl = getBaseUrl();

  return `User-agent: *
Allow: /

Disallow: /post?id=
Disallow: /draft
Disallow: /admin
Disallow: /api/
Disallow: /health

Sitemap: ${baseUrl}/sitemap.xml
`;
}

module.exports = {
  generateSitemapXml,
  generateRobotsTxt
};
