const axios = require("axios");

const { generateAutoPost } = require("./autoPostService");

/*
==================================================
CONFIG
==================================================
*/

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

/*
==================================================
TOPICS INTELIGENTES
==================================================
*/

const TOPICS = {
  "renda-extra": [
    "como ganhar dinheiro na internet",
    "formas de renda extra em casa",
    "ideias para ganhar dinheiro hoje",
    "negócios simples para começar com pouco dinheiro"
  ],

  investimentos: [
    "como investir com pouco dinheiro",
    "melhores investimentos hoje",
    "como diversificar investimentos",
    "renda passiva para iniciantes"
  ],

  trabalho: [
    "profissões mais bem pagas no Brasil",
    "trabalhos com alta demanda",
    "quanto ganha cada profissão hoje",
    "mercado de trabalho atual"
  ]
};

/*
==================================================
NOTÍCIAS (NEWS API)
==================================================
*/

async function fetchNews() {
  try {
    const res = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=br&category=business&apiKey=${NEWS_API_KEY}`
    );

    return res.data.articles.slice(0, 5);

  } catch (err) {
    console.log("Erro NewsAPI:", err.message);
    return [];
  }
}

/*
==================================================
GERAÇÃO DE POST BASEADO EM NOTÍCIA
==================================================
*/

async function generateNewsPost(article) {
  try {
    const prompt = `
Explique essa notícia de forma simples, clara e fácil:

Título: ${article.title}
Descrição: ${article.description}

Regras:
- linguagem simples
- SEO forte
- explicar impacto no bolso
- não prometer ganhos
`;

    return generateAutoPost({
      topic: article.title,
      category: "noticias",
      customPrompt: prompt,
      mode: "news"
    });

  } catch (err) {
    console.log("Erro gerar notícia:", err.message);
  }
}

/*
==================================================
ESCOLHA INTELIGENTE DE CONTEÚDO
==================================================
*/

function pickRandomTopic() {
  const categorias = Object.keys(TOPICS);
  const categoria = categorias[Math.floor(Math.random() * categorias.length)];

  const lista = TOPICS[categoria];
  const topic = lista[Math.floor(Math.random() * lista.length)];

  return { topic, categoria };
}

/*
==================================================
ENGINE PRINCIPAL
==================================================
*/

function startContentEngine({ intervalMs = 1800000 }) {

  console.log("🤖 Content Engine iniciado");

  setInterval(async () => {
    try {
      console.log("🔥 Rodando ciclo automático...");

      /*
      ======================
      POST NORMAL
      ======================
      */

      const { topic, categoria } = pickRandomTopic();

      await generateAutoPost({
        topic,
        category: categoria,
        mode: "auto"
      });

      /*
      ======================
      NOTÍCIAS
      ======================
      */

      const news = await fetchNews();

      for (const article of news) {
        await generateNewsPost(article);
      }

    } catch (err) {
      console.log("Erro engine:", err.message);
    }
  }, intervalMs);
}

module.exports = {
  startContentEngine
};
