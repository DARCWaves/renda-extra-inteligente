const fs = require("fs");
const path = require("path");
const axios = require("axios");

/*
==================================================
CONFIG
==================================================
*/

const POSTS_PATH = path.join(__dirname, "..", "data", "posts.json");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/*
==================================================
UTILS
==================================================
*/

function ensurePostsFile() {
  if (!fs.existsSync(POSTS_PATH)) {
    fs.writeFileSync(POSTS_PATH, JSON.stringify([], null, 2));
  }
}

function readPosts() {
  ensurePostsFile();
  return JSON.parse(fs.readFileSync(POSTS_PATH));
}

function savePosts(posts) {
  fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2));
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/*
==================================================
ANTI DUPLICAÇÃO
==================================================
*/

function postExists(title) {
  const posts = readPosts();
  return posts.some(p => p.title.toLowerCase() === title.toLowerCase());
}

/*
==================================================
SEO PROMPT ENGINE (O OURO)
==================================================
*/

function buildPrompt({ topic, category, customPrompt }) {

  if (customPrompt) return customPrompt;

  const base = `
Você é um especialista em SEO avançado e finanças.

Crie um conteúdo EXTREMAMENTE otimizado para Google com as regras:

- linguagem simples (até criança entende)
- altamente persuasivo (sem prometer ganhos)
- focado na dor do usuário
- direto, claro e envolvente
- evitar termos técnicos sem explicação
- ensinar passo a passo
- manter credibilidade

Estrutura obrigatória:

TÍTULO (forte e chamativo)
DESCRIÇÃO (SEO)
INTRODUÇÃO (conectando com dor real)
DESENVOLVIMENTO (explicando tudo)
EXEMPLOS PRÁTICOS
CONCLUSÃO (com ação clara)

Tema:
${topic}
`;

  /*
  ============================
  PERSONALIZAÇÃO POR CATEGORIA
  ============================
  */

  if (category === "renda-extra") {
    return base + `
Foque em:
- formas reais de ganhar dinheiro
- ideias práticas
- internet e renda atual
- sem promessas
`;
  }

  if (category === "investimentos") {
    return base + `
Foque em:
- diversificação
- iniciantes
- pouco dinheiro
- risco e consciência
`;
  }

  if (category === "trabalho") {
    return base + `
Foque em:
- mercado atual
- média salarial
- demanda
- crescimento da área
`;
  }

  if (category === "noticias") {
    return base + `
Foque em:
- explicar notícia
- impacto no bolso
- linguagem simples
`;
  }

  return base;
}

/*
==================================================
OPENAI REQUEST
==================================================
*/

async function generateContent(prompt) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você escreve artigos de alto nível com SEO profissional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`
      }
    }
  );

  return response.data.choices[0].message.content;
}

/*
==================================================
EXTRAÇÃO DE ESTRUTURA
==================================================
*/

function parseContent(rawText, topic) {

  const lines = rawText.split("\n");

  let title = topic;
  let description = topic;

  if (lines.length > 0) {
    title = lines[0].replace(/^#+\s*/, "").trim();
  }

  if (lines.length > 1) {
    description = lines[1].trim();
  }

  return {
    title,
    description,
    content: rawText
  };
}

/*
==================================================
CRIADOR DE POST
==================================================
*/

async function generateAutoPost({
  topic = "finanças pessoais",
  category = "financas",
  customPrompt = null,
  mode = "auto"
}) {

  try {

    if (!OPENAI_API_KEY) {
      console.log("⚠️ OPENAI_API_KEY não configurada");
      return null;
    }

    if (postExists(topic)) {
      console.log("⚠️ Post já existe:", topic);
      return null;
    }

    const prompt = buildPrompt({ topic, category, customPrompt });

    const rawContent = await generateContent(prompt);

    const parsed = parseContent(rawContent, topic);

    const posts = readPosts();

    const newPost = {
      slug: slugify(parsed.title + "-" + Date.now()),
      title: parsed.title,
      description: parsed.description,
      content: parsed.content,
      category,
      mode,
      createdAt: new Date().toISOString(),
      seoTitle: parsed.title,
      seoDescription: parsed.description,
      keywords: topic.split(" ")
    };

    posts.unshift(newPost);
    savePosts(posts);

    console.log("✅ POST CRIADO:", newPost.slug);

    return newPost;

  } catch (err) {
    console.log("❌ ERRO AUTO POST:", err.message);
    return null;
  }
}

/*
==================================================
EXPORT
==================================================
*/

module.exports = {
  generateAutoPost
};
