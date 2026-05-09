const axios = require("axios");
const { clearPostCache } = require("./postService");
const { readJson, writeJson } = require("./storageAdapter");

/*
==================================================
CONFIG
==================================================
*/

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/*
==================================================
UTILS
==================================================
*/

function readPosts() {
  return readJson("posts", []);
}

function savePosts(posts) {
  return writeJson("posts", posts.slice(0, 1000));
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

const CONTENT_FORMATS = {
  tutorial: {
    name: "Tutorial Prático",
    rules: "Foco em 'Como fazer' com passos numerados claros, dicas de execução e um checklist final."
  },
  guide: {
    name: "Guia para Iniciantes",
    rules: "Linguagem ultra-simples, focada em conceitos básicos, definições claras e 'o que não fazer' no início."
  },
  simulation: {
    name: "Simulação Financeira",
    rules: "Inclua cenários hipotéticos de 'e se' (ex: Se você poupar X, terá Y em Z tempo) com cálculos simples e comparativos."
  },
  mistakes: {
    name: "Análise de Erros",
    rules: "Foque nos erros mais comuns que as pessoas cometem no tema, explicando por que ocorrem e como evitá-los."
  }
};

function buildPrompt({ topic, category, customPrompt, format }) {

  if (customPrompt) return customPrompt;

  const selectedFormat = CONTENT_FORMATS[format] || { name: "Artigo Geral", rules: "Ensine o passo a passo com exemplos práticos." };

  const base = `
Você é um especialista em SEO avançado e finanças.
Formato do conteúdo: ${selectedFormat.name}
Regras do formato: ${selectedFormat.rules}

Crie um conteúdo EXTREMAMENTE otimizado para Google com as regras:

- linguagem simples (até criança entende)
- altamente persuasivo (sem prometer ganhos)
- focado na dor do usuário
- direto, claro e envolvente
- evitar termos técnicos sem explicação
- manter credibilidade

Estrutura obrigatória:

TÍTULO (forte e chamativo)
DESCRIÇÃO (SEO)
INTRODUÇÃO (conectando com dor real)
DESENVOLVIMENTO (respeitando o formato ${selectedFormat.name})
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
  mode = "auto",
  format = "tutorial"
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

    const prompt = buildPrompt({ topic, category, customPrompt, format });

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

    clearPostCache();

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
