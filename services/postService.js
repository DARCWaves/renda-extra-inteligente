const fs = require("fs");
const path = require("path");

const POSTS_FILE = path.join(__dirname, "..", "data", "posts.json");

function readPosts() {
  try {
    if (!fs.existsSync(POSTS_FILE)) return [];

    const raw = fs.readFileSync(POSTS_FILE, "utf8");
    if (!raw.trim()) return [];

    return JSON.parse(raw);
  } catch (err) {
    console.error("Erro ao ler posts:", err.message);
    return [];
  }
}

function getAllPosts() {
  return readPosts().sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function getPostBySlug(slug) {
  return getAllPosts().find((post) => post.slug === slug);
}

function getPostsByCategory(category) {
  return getAllPosts().filter((post) => post.category === category);
}

function getLatestPosts(limit = 6) {
  return getAllPosts().slice(0, limit);
}

function getCategories() {
  return [...new Set(getAllPosts().map((post) => post.category))];
}

module.exports = {
  getAllPosts,
  getPostBySlug,
  getPostsByCategory,
  getLatestPosts,
  getCategories
};
