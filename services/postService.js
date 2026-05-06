const path = require("path");
const { readJson } = require("./storageAdapter");

const {
  normalizeCategory
} = require("./contentStrategyService");

const FILE_KEY = "posts";

/*
==================================================
CACHE DE POSTS (ALTA PERFORMANCE)
==================================================
*/

let postsCache = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 30000; // 30 segundos

/**
 * Ordena posts por data de atualização ou criação.
 */
function sortByDate(posts) {
  return posts.slice().sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });
}

function readPosts() {
  const now = Date.now();

  // Se o cache for válido, retorna os posts já prontos (ordenados e normalizados)
  if (postsCache && (now - lastCacheUpdate < CACHE_TTL)) {
    return postsCache;
  }

  try {
    const parsed = readJson(FILE_KEY, []);

    if (!Array.isArray(parsed)) return postsCache || [];

    // Processa os posts: filtra, normaliza categoria e ordena
    const processed = sortByDate(
      parsed
        .filter((post) => post && typeof post === "object")
        .filter((post) => String(post.status || "published").toLowerCase() !== "draft")
        .map((post) => ({
          ...post,
          category: normalizeCategory(post.category, post.title, post.content)
        }))
    );

    postsCache = processed;
    lastCacheUpdate = now;

    return processed;
  } catch (err) {
    console.error("❌ [PostService] Erro fatal no processamento:", err.message);
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

function getAllPosts() {
  return readPosts();
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
    return post.category === normalized;
  });
}

function getRelatedPosts(currentSlug, category, limit = 3) {
  try {
    const posts = getPostsByCategory(category);
    return posts
      .filter((p) => p.slug !== currentSlug)
      .slice(0, Number(limit || 3));
  } catch (err) {
    console.error("ERRO getRelatedPosts:", err.message);
    return [];
  }
}

module.exports = {
  getAllPosts,
  getLatestPosts,
  getPostBySlug,
  getPostsByCategory,
  getRelatedPosts,
  clearPostCache
};
