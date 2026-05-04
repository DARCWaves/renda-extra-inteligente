const fs = require("fs");
const path = require("path");
const { makePostImage } = require("../services/postImageService");

const postsFile = path.join(__dirname, "..", "data", "posts.json");

if (!fs.existsSync(postsFile)) {
  console.log("Nenhum posts.json encontrado.");
  process.exit(0);
}

const raw = fs.readFileSync(postsFile, "utf8");
const posts = raw.trim() ? JSON.parse(raw) : [];

const updated = posts.map(post => {
  const imageData = makePostImage(post);

  return {
    ...post,
    image: imageData.image,
    imageAlt: imageData.imageAlt,
    updatedAt: new Date().toISOString()
  };
});

fs.writeFileSync(postsFile, JSON.stringify(updated, null, 2), "utf8");

console.log(`✅ Imagens geradas para ${updated.length} posts.`);
