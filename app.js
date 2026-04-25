require("dotenv").config();

const express = require("express");
const path = require("path");
const axios = require("axios");

const autoPostService = require("./services/autoPostService");
const affiliateService = require("./services/affiliateService");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   CONFIGURAÇÕES GLOBAIS
========================= */

const APP_NAME = "Renda Extra Inteligente";

const BASE_URL = process.env.BASE_URL || process.env.SITE_URL;
const ADSENSE_CLIENT = process.env.ADSENSE_CLIENT || "";
const ADSENSE_SLOT = process.env.ADSENSE_SLOT || "";

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/* =========================
   MIDDLEWARES
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* =========================
   VARIÁVEIS GLOBAIS (FIX CRÍTICO)
========================= */

app.use((req, res, next) => {
  res.locals.appName = APP_NAME;
  res.locals.baseUrl = BASE_URL;

  // 🔥 CORREÇÃO DO ERRO 500
  res.locals.title = APP_NAME;
  res.locals.description =
    "Finanças pessoais, renda extra, investimentos, indicadores econômicos e inteligência financeira.";

  // AdSense
  res.locals.adsenseClient = ADSENSE_CLIENT;
  res.locals.adsenseSlot = ADSENSE_SLOT;

  // Afiliados
  res.locals.affiliates = affiliateService.getActiveAffiliates();
  res.locals.affiliate = affiliateService.getRandomAffiliate();

  next();
});

/* =========================
   CACHE SIMPLES
========================= */

let dollarCache = {
  value: null,
  updatedAt: 0,
};

let indicatorsCache = [];

/* =========================
   SERVIÇO DÓLAR (COM FALLBACK)
========================= */

async function getDollar() {
  const now = Date.now();

  if (dollarCache.value && now - dollarCache.updatedAt < 10 * 60 * 1000) {
    return dollarCache.value;
  }

  try {
    const response = await axios.get(
      "https://economia.awesomeapi.com.br/json/last/USD-BRL"
    );

    const value = parseFloat(response.data.USDBRL.bid);

    dollarCache = {
      value,
      updatedAt: now,
    };

    return value;
  } catch (err) {
    console.log("⚠️ Erro dólar tempo real:", err.response?.status);

    // fallback
    return dollarCache.value || 5.0;
  }
}

/* =========================
   INDICADORES MOCK (BASE)
========================= */

function getIndicators() {
  return [
    {
      slug: "dolar",
      nome: "Cotação do Dólar",
      valor: "Carregando...",
      explicacao:
        "O dólar influencia preços, inflação e economia global.",
      impactoBolso:
        "Quando sobe, tudo fica mais caro: combustível, comida e importados.",
    },
    {
      slug: "ipca",
      nome: "Inflação (IPCA)",
      valor: "Carregando...",
      explicacao:
        "O IPCA mede o aumento dos preços ao longo do tempo.",
      impactoBolso:
        "Seu dinheiro perde valor se a inflação sobe.",
    },
  ];
}

/* =========================
   ROTAS
========================= */

// HOME
app.get("/", async (req, res) => {
  try {
    let indicators = getIndicators();

    const dolar = await getDollar();

    indicators = indicators.map((i) => {
      if (i.slug === "dolar") {
        return {
          ...i,
          valor: `R$ ${dolar.toFixed(2)}`,
        };
      }
      return i;
    });

    res.render("home", {
      title: "Início",
      description: "Aprenda finanças e renda extra",
      indicators,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Erro ao carregar página");
  }
});

// INDICADOR
app.get("/indicador/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;

    let indicators = getIndicators();

    let indicador = indicators.find((i) => i.slug === slug);

    if (!indicador) {
      return res.status(404).send("Indicador não encontrado");
    }

    if (slug === "dolar") {
      const dolar = await getDollar();

      indicador.valor = `R$ ${dolar.toFixed(2)}`;
    }

    res.render("indicator", {
      title: indicador.nome,
      description: indicador.explicacao,
      indicador,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Erro ao carregar indicador");
  }
});

// POSTS
app.get("/posts", (req, res) => {
  const posts = autoPostService.getPosts();

  res.render("posts", {
    title: "Conteúdos",
    description: "Artigos de finanças e renda extra",
    posts,
  });
});

// POST
app.get("/post/:id", (req, res) => {
  const post = autoPostService.getPostById(req.params.id);

  if (!post) return res.status(404).send("Post não encontrado");

  res.render("post", {
    title: post.title,
    description: post.description,
    post,
  });
});

/* =========================
   AUTO POSTS (CORE DO PROJETO)
========================= */

if (process.env.AUTO_POSTS === "true") {
  console.log("🔥 Auto posts ativado");

  const interval =
    parseInt(process.env.AUTO_POST_INTERVAL_MS) || 1800000;

  setInterval(async () => {
    console.log("⚡ Gerando conteúdo automático...");

    try {
      await autoPostService.generateAndPublish();
    } catch (err) {
      console.log("Erro auto post:", err.message);
    }
  }, interval);
}

/* =========================
   HEALTH CHECK
========================= */

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    adsense: !!ADSENSE_CLIENT,
    autoPost: process.env.AUTO_POSTS,
  });
});

/* =========================
   START
========================= */

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
