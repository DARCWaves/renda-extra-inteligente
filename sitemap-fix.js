const fs = require("fs");
const path = require("path");

const BASE_URL =
  process.env.BASE_URL ||
  process.env.SITE_URL ||
  "https://renda-extra-inteligente.onrender.com";

const POSTS_FILE = path.join(__dirname, "data", "posts.json");

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function readPostsSafe() {
  try {
    if (!fs.existsSync(POSTS_FILE)) return [];

    const raw = fs.readFileSync(POSTS_FILE, "utf8");
    if (!raw.trim()) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Erro lendo posts para sitemap:", err.message);
    return [];
  }
}

function normalizeDate(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function cleanSlug(slug) {
  return String(slug || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/^post\//, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
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

function addUrl(list, seen, loc, options = {}) {
  const cleanLoc = String(loc || "").trim();

  if (!cleanLoc) return;
  if (seen.has(cleanLoc)) return;

  seen.add(cleanLoc);

  const lastmod = options.lastmod
    ? `\n    <lastmod>${escapeXml(normalizeDate(options.lastmod))}</lastmod>`
    : "";

  const changefreq = options.changefreq
    ? `\n    <changefreq>${escapeXml(options.changefreq)}</changefreq>`
    : "";

  const priority = options.priority
    ? `\n    <priority>${escapeXml(options.priority)}</priority>`
    : "";

  list.push(`  <url>
    <loc>${escapeXml(cleanLoc)}</loc>${lastmod}${changefreq}${priority}
  </url>`);
}

function generateSitemap() {
  const posts = readPostsSafe();

  const urls = [];
  const seenUrls = new Set();

  addUrl(urls, seenUrls, `${BASE_URL}/`, {
    changefreq: "daily",
    priority: "1.0"
  });

  addUrl(urls, seenUrls, `${BASE_URL}/posts`, {
    changefreq: "daily",
    priority: "0.9"
  });

  addUrl(urls, seenUrls, `${BASE_URL}/categoria/financas`, {
    changefreq: "weekly",
    priority: "0.8"
  });

  addUrl(urls, seenUrls, `${BASE_URL}/categoria/renda-extra`, {
    changefreq: "weekly",
    priority: "0.8"
  });

  addUrl(urls, seenUrls, `${BASE_URL}/categoria/programacao`, {
    changefreq: "weekly",
    priority: "0.8"
  });

  addUrl(urls, seenUrls, `${BASE_URL}/categoria/investimentos`, {
    changefreq: "weekly",
    priority: "0.8"
  });

  addUrl(urls, seenUrls, `${BASE_URL}/categoria/trabalho`, {
    changefreq: "weekly",
    priority: "0.7"
  });

  addUrl(urls, seenUrls, `${BASE_URL}/categoria/economia`, {
    changefreq: "weekly",
    priority: "0.7"
  });

  addUrl(urls, seenUrls, `${BASE_URL}/indicadores`, {
    changefreq: "daily",
    priority: "0.8"
  });

  addUrl(urls, seenUrls, `${BASE_URL}/ofertas`, {
    changefreq: "weekly",
    priority: "0.6"
  });

  const bestByKey = new Map();

  posts.filter(isValidPost).forEach((post) => {
    const slug = cleanSlug(post.slug);
    const key = canonicalKey(slug);

    if (!bestByKey.has(key)) {
      bestByKey.set(key, post);
      return;
    }

    const current = bestByKey.get(key);
    const currentDate = new Date(current.updatedAt || current.createdAt || 0).getTime();
    const nextDate = new Date(post.updatedAt || post.createdAt || 0).getTime();

    if (nextDate > currentDate) {
      bestByKey.set(key, post);
    }
  });

  Array.from(bestByKey.values()).forEach((post) => {
    const slug = cleanSlug(post.slug);

    addUrl(urls, seenUrls, `${BASE_URL}/post/${encodeURIComponent(slug)}`, {
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

module.exports = {
  generateSitemap
};
