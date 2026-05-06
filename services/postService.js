const fs = require("fs");
const path = require("path");

const {
  normalizeCategory
} = require("./contentStrategyService");

const postsFile = path.join(__dirname, "..", "data", "posts.json");

function ensurePostsFile() {
  const dir = path.dirname(postsFile);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(postsFile)) {
    fs.writeFileSync(postsFile, JSON.stringify([], null, 2), "utf8");
  }
}

/*
==================================================
CACHE DE POSTS (EVITA BLOQUEIO SÍNCRONO)
==================================================
*/

let postsCache = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 30000; // 30 segundos

function readPosts() {
  ensurePostsFile();

  const now = Date.now();

  if (postsCache && (now - lastCacheUpdate < CACHE_TTL)) {
    return postsCache;
  }

  try {
    const raw = fs.readFileSync(postsFile, "utf8");
    const parsed = raw.trim() ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    const result = parsed
      .filter((post) => post && typeof post === "object")
      .filter((post) => String(post.status || "published").toLowerCase() !== "draft")
      .map((post) => ({
        ...post,
        category: normalizeCategory(post.category, post.title, post.content)
      }));

    postsCache = result;
    lastCacheUpdate = now;

    return result;
  } catch (err) {
    console.error("ERRO POST SERVICE:", err.message);
    return postsCache || [];
  }
}

/**
 * Força a limpeza do cache (útil após criar novo post)
 */
function clearPostCache() {
  postsCache = null;
  lastCacheUpdate = 0;
}

function sortByDate(posts) {
  return posts.slice().sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();

    return dateB - dateA;
  });
}

function getAllPosts() {
  return sortByDate(readPosts());
}

function getLatestPosts(limit = 6) {
  return getAllPosts().slice(0, Number(limit || 6));
}

function getPostBySlug(slug) {
  const target = String(slug || "").trim();

  if (!target) return null;

  return getAllPosts().find((post) => String(post.slug || "") === target) || null;
}

function getPostsByCategory(category) {
  const normalized = normalizeCategory(category);

  return getAllPosts().filter((post) => {
    return normalizeCategory(post.category, post.title, post.content) === normalized;
  });
}

module.exports = {
  getAllPosts,
  getLatestPosts,
  getPostBySlug,
  getPostsByCategory,
  clearPostCache
};
