require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { generatePostImage } = require("../services/postImageService");

const postsFile = path.join(__dirname, "..", "data", "posts.json");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (!fs.existsSync(postsFile)) {
    console.log("Nenhum posts.json encontrado.");
    return;
  }

  const raw = fs.readFileSync(postsFile, "utf8");
  const posts = raw.trim() ? JSON.parse(raw) : [];

  let count = 0;

  for (const post of posts) {
    try {
      console.log("Gerando imagem:", post.title);

      const imageData = await generatePostImage(post);

      post.image = imageData.image;
      post.imageAlt = imageData.imageAlt;
      post.imagePrompt = imageData.imagePrompt;
      post.updatedAt = new Date().toISOString();

      count += 1;

      fs.writeFileSync(postsFile, JSON.stringify(posts, null, 2), "utf8");

      await sleep(1500);
    } catch (err) {
      console.log("Erro ao gerar imagem:", post.title, err.message);
    }
  }

  console.log(`✅ Imagens reais processadas para ${count} posts.`);
}

main();
