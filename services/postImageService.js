const axios = require("axios");
const { ensureDirectory, fileExists, ROOT, writeRaw } = require("./storageAdapter");
const path = require("path");

const outputDir = path.join(ROOT, "public", "images", "posts");

function ensureDir() {
  ensureDirectory(outputDir);
}

function slugify(text) {
  return String(text || "post")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

function categoryScene(post) {
  const title = String(post.title || "").toLowerCase();
  const category = post.category || "financas";

  if (category === "renda-extra") {
    return "uma pessoa jovem adulta sentada no quarto em uma mesa simples, usando notebook, celular ao lado, caderno aberto, café na mesa, pesquisando formas reais de ganhar dinheiro pela internet; ambiente brasileiro, quarto pequeno, organizado, luz quente, sensação de foco e esperança";
  }

  if (category === "programacao") {
    return "uma pessoa iniciante estudando programação em um notebook, tela com código simples desfocado, caderno com passos de lógica, café ao lado, mesa no quarto, iluminação noturna elegante, sensação de descoberta e concentração";
  }

  if (category === "financas") {
    return "uma pessoa sentada à mesa de casa olhando contas, caderno financeiro, celular com planilha, expressão pensativa mas determinada, ambiente simples e realista, luz dramática, sensação de decisão financeira importante";
  }

  if (category === "trabalho") {
    return "um trabalhador comum chegando em casa depois do trabalho, sentado à mesa planejando uma nova habilidade para aumentar renda, notebook aberto, uniforme ou roupa simples, expressão cansada mas determinada, cenário realista brasileiro";
  }

  if (category === "investimentos") {
    return "uma pessoa olhando gráficos simples no notebook e anotando metas de investimento em um caderno, moedas e cartão sobre a mesa, ambiente elegante e minimalista, sensação de começo responsável e segurança";
  }

  if (category === "economia") {
    return "uma pessoa no mercado olhando preços altos em prateleiras, segurando celular com lista de compras, expressão preocupada, luz cinematográfica, mostrando o impacto da inflação no dia a dia";
  }

  if (title.includes("dólar") || title.includes("dolar")) {
    return "uma pessoa comparando preços de eletrônicos e alimentos no notebook, com símbolo discreto de dólar em uma tela desfocada, expressão preocupada, ambiente doméstico realista";
  }

  return "uma pessoa comum estudando formas de melhorar a vida financeira em uma mesa simples, notebook, celular, caderno, café, ambiente organizado e realista, luz cinematográfica";
}

function buildImagePrompt(post) {
  const scene = categoryScene(post);

  return `
Crie uma imagem fotorealista horizontal 16:9, estilo editorial premium, sem texto escrito na imagem.

Tema do conteúdo:
"${post.title || "Educação financeira prática"}"

Cena:
${scene}

Estilo visual:
- fotografia realista
- estética premium, parecida com campanha de marca grande
- iluminação cinematográfica
- cores preto, dourado, branco e tons quentes
- visual limpo, moderno e persuasivo
- foco na dor real da pessoa e na solução prática
- sem logos, sem marcas famosas, sem texto legível
- sem aparência infantil
- sem desenho, sem cartoon
- qualidade alta para capa de artigo e SEO visual
`.trim();
}

async function generatePostImage(post) {
  ensureDir();

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      image: "",
      imageAlt: `${post.title || "Conteúdo"} - imagem ainda não gerada`,
      imagePrompt: buildImagePrompt(post)
    };
  }

  const fileName = `${slugify(post.slug || post.title)}.png`;
  const filePath = path.join(outputDir, fileName);
  const publicPath = `/images/posts/${fileName}`;

  if (fileExists(filePath, "")) {
    return {
      image: publicPath,
      imageAlt: `${post.title || "Conteúdo"} - imagem visual do conteúdo`,
      imagePrompt: buildImagePrompt(post)
    };
  }

  const prompt = buildImagePrompt(post);

  const response = await axios.post(
    "https://api.openai.com/v1/images/generations",
    {
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: "1536x1024"
    },
    {
      timeout: 120000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  const item = response.data?.data?.[0];
  const b64 = item?.b64_json;

  if (!b64) {
    throw new Error("A API de imagem não retornou b64_json.");
  }

  writeRaw(filePath, Buffer.from(b64, "base64"), "");

  return {
    image: publicPath,
    imageAlt: `${post.title || "Conteúdo"} - imagem realista sobre a dor do conteúdo`,
    imagePrompt: prompt
  };
}

module.exports = {
  generatePostImage,
  buildImagePrompt
};
