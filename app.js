require("dotenv").config();

const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

/*
==================================================
SERVICES
==================================================
*/

const { getEconomicData } = require("./services/economicService");
const { analyzeFinancialScenario } = require("./services/financialAI");
const { getIndicators } = require("./services/indicatorService");

const {
  getAllPosts,
  getPostBySlug,
  getPostsByCategory,
  getLatestPosts
} = require("./services/postService");

const {
  getActiveAffiliate,
  getActiveAffiliates,
  getAffiliatesForContext,
  registerAffiliateClick,
  getAffiliateStats
} = require("./services/affiliateService");

/*
==================================================
CONTENT ENGINE
==================================================
*/

let startContentEngine = null;

try {
  const contentEngine = require("./services/contentEngine");
  startContentEngine = contentEngine.startContentEngine;
} catch (err) {
  console.log("⚠️ contentEngine não carregado:", err.message);
}

/*
==================================================
CONFIG
==================================================
*/

const app = express();

const APP_NAME = "Renda Extra Inteligente";

const BASE_URL =
  process.env.BASE_URL ||
  process.env.SITE_URL ||
  "http://localhost:3000";

const ADSENSE_CLIENT = process.env.ADSENSE_CLIENT || "";
const ADSENSE_SLOT = process.env.ADSENSE_SLOT || "";
/*
==================================================
HELPERS
==================================================
*/

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value, fallback = "") {
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}

function normalizeCategory(category) {
  const value = String(category || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const map = {
    financas: "financas",
    "finanças": "financas",
    financeiro: "financas",
    investimentos: "investimentos",
    investimento: "investimentos",
    "renda-extra": "renda-extra",
    rendaextra: "renda-extra",
    renda: "renda-extra",
    trabalho: "trabalho",
    emprego: "trabalho",
    empregos: "trabalho",
    economia: "economia",
    noticias: "noticias",
    noticia: "noticias",
    notícias: "noticias"
  };

  return map[value] || value || "financas";
}

function normalizeIndicators(indicators, economicData) {
  if (indicators && Array.isArray(indicators.resumo)) {
    return indicators;
  }

  return {
    resumo: [
      {
        nome: "Dólar",
        valor: economicData?.dolar || "Carregando...",
        periodo: economicData?.periodos?.dolar || "",
        slug: "dolar"
      },
      {
        nome: "Taxa Selic",
        valor: economicData?.selic || "Carregando...",
        periodo: economicData?.periodos?.selic || "",
        slug: "selic"
      },
      {
        nome: "Inflação oficial",
        valor: economicData?.inflacao || "Carregando...",
        periodo: economicData?.periodos?.inflacao || "",
        slug: "inflacao"
      },
      {
        nome: "Índice do Bolso Popular",
        valor: economicData?.bolsoPopular || "Carregando...",
        periodo: economicData?.periodos?.bolsoPopular || "",
        slug: "bolso-popular"
      },
      {
        nome: "Salário mínimo",
        valor: economicData?.salarioMinimo || "Carregando...",
        periodo: economicData?.periodos?.salarioMinimo || "",
        slug: "salario-minimo"
      },
      {
        nome: "Arrecadação de tributos",
        valor: economicData?.arrecadacao || "Carregando...",
        periodo: economicData?.periodos?.arrecadacao || "",
        slug: "tributos"
      }
    ],
    detalhes: indicators?.detalhes || {},
    iaFinanceira: indicators?.iaFinanceira || null
  };
}
/*
==================================================
MIDDLEWARES
==================================================
*/

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

/*
==================================================
VIEW ENGINE
==================================================
*/

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);
app.set("layout", "layout");

/*
==================================================
LOCALS GLOBAIS
==================================================
*/

app.use((req, res, next) => {
  try {
    const affiliates = safeArray(getActiveAffiliates());

    res.locals.appName = APP_NAME;
    res.locals.baseUrl = BASE_URL;

    res.locals.title = APP_NAME;
    res.locals.description =
      "Finanças pessoais, renda extra, investimentos, indicadores econômicos e inteligência financeira.";

    res.locals.adsenseClient = ADSENSE_CLIENT;
    res.locals.adsenseSlot = ADSENSE_SLOT;

    res.locals.affiliates = affiliates;
    res.locals.affiliate =
      typeof getActiveAffiliate === "function" ? getActiveAffiliate() : affiliates[0] || null;

    next();
  } catch (err) {
    console.error("ERRO LOCALS:", err.message);

    res.locals.appName = APP_NAME;
    res.locals.baseUrl = BASE_URL;
    res.locals.title = APP_NAME;
    res.locals.description =
      "Finanças pessoais, renda extra, investimentos, indicadores econômicos e inteligência financeira.";
    res.locals.adsenseClient = ADSENSE_CLIENT;
    res.locals.adsenseSlot = ADSENSE_SLOT;
    res.locals.affiliates = [];
    res.locals.affiliate = null;

    next();
  }
});
/*
==================================================
HOME
==================================================
*/

app.get("/", async (req, res) => {
  try {
    const posts = safeArray(getLatestPosts(6));

    const economicData = await getEconomicData();
    const rawIndicators = await getIndicators();
    const indicators = normalizeIndicators(rawIndicators, economicData);

    const affiliates = safeArray(
      getAffiliatesForContext(
        "home finanças renda extra investimentos economia controle financeiro dinheiro",
        8
      )
    );

    return res.render("home", {
      title: APP_NAME,
      description:
        "Finanças pessoais, renda extra, investimentos, indicadores econômicos e inteligência financeira sem promessas irreais.",
      posts,
      data: economicData,
      indicators,
      affiliates
    });
  } catch (err) {
    console.error("ERRO HOME:", err);
    return res.status(500).send("Erro do Servidor Interno");
  }
});
/*
==================================================
INDICADORES
==================================================
*/

app.get("/indicadores", async (req, res) => {
  try {
    const economicData = await getEconomicData();
    const ai = analyzeFinancialScenario(economicData);

    const rawIndicators = await getIndicators();
    const indicators = normalizeIndicators(rawIndicators, economicData);

    const affiliates = safeArray(
      getAffiliatesForContext(
        "indicadores economia inflação selic dólar salário mínimo tributos bolso popular",
        8
      )
    );

    return res.render("indicadores", {
      title: "Indicadores Econômicos",
      description:
        "Dólar, Selic, inflação, salário mínimo, arrecadação, bolso popular e análise financeira inteligente.",
      data: economicData,
      ai,
      indicators,
      affiliates
    });
  } catch (err) {
    console.error("ERRO INDICADORES:", err);
    return res.status(500).send("Erro do Servidor Interno");
  }
});
/*
==================================================
INDICADOR INDIVIDUAL
==================================================
*/

app.get("/indicador/:slug", async (req, res) => {
  try {
    const economicData = await getEconomicData();
    const rawIndicators = await getIndicators();
    const indicators = normalizeIndicators(rawIndicators, economicData);

    const indicador = indicators.detalhes?.[req.params.slug] || null;

    if (!indicador) {
      return res.status(404).send("Indicador não encontrado");
    }

    const context = `
      ${indicador.titulo || ""}
      ${indicador.explicacao || ""}
      ${indicador.slug || ""}
      finanças economia renda extra investimentos dinheiro
    `;

    const affiliates = safeArray(getAffiliatesForContext(context, 8));

    return res.render("indicator", {
      title: indicador.seoTitle || indicador.titulo || APP_NAME,
      description:
        indicador.seoDescription ||
        indicador.explicacao ||
        "Indicador econômico explicado de forma simples.",
      indicador,
      iaFinanceira: indicators.iaFinanceira,
      affiliates,
      adsenseClient: ADSENSE_CLIENT,
      adsenseSlot: ADSENSE_SLOT
    });
  } catch (err) {
    console.error("ERRO INDICADOR:", err);
    return res.status(500).send("Erro do Servidor Interno");
  }
});
/*
==================================================
POSTS (LISTAGEM)
==================================================
*/

app.get("/posts", (req, res) => {
  try {
    // 🔥 CORREÇÃO CRÍTICA AQUI
    const result = getAllPosts();

    // Garante que sempre será array
    const posts = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
      ? result.data
      : [];

    const affiliates = safeArray(
      getAffiliatesForContext(
        "conteúdos finanças renda extra investimentos educação financeira dinheiro",
        8
      )
    );

    return res.render("posts", {
      title: "Conteúdos sobre Finanças",
      description:
        "Conteúdos educativos sobre finanças pessoais, renda extra, investimentos e economia real.",
      posts,
      affiliates
    });
  } catch (err) {
    console.error("ERRO POSTS:", err);
    return res.status(500).send("Erro do Servidor Interno");
  }
});
/*
==================================================
POST INDIVIDUAL
==================================================
*/

app.get("/post/:slug", (req, res) => {
  try {
    const post = getPostBySlug(req.params.slug);

    if (!post) {
      return res.status(404).send("Post não encontrado");
    }

    const context = `
      ${post.title || ""}
      ${post.description || ""}
      ${post.category || ""}
      ${post.content || ""}
      finanças renda extra investimentos economia dinheiro
    `;

    const affiliates = safeArray(getAffiliatesForContext(context, 8));

    return res.render("post", {
      title: post.seoTitle || post.title || APP_NAME,
      description:
        post.seoDescription ||
        post.description ||
        "Conteúdo sobre finanças pessoais, renda extra e economia.",
      post,
      affiliates,
      adsenseClient: ADSENSE_CLIENT,
      adsenseSlot: ADSENSE_SLOT
    });
  } catch (err) {
    console.error("ERRO POST:", err);
    return res.status(500).send("Erro do Servidor Interno");
  }
});
/*
==================================================
CATEGORIAS
==================================================
*/

app.get("/categoria/:categoria", (req, res) => {
  try {
    const categoria = req.params.categoria;

    const posts = safeArray(getPostsByCategory(categoria));

    const affiliates = safeArray(
      getAffiliatesForContext(
        `${categoria} finanças renda extra investimentos economia dinheiro`,
        8
      )
    );

    return res.render("category", {
      title: `Categoria: ${categoria}`,
      description: "Conteúdos financeiros filtrados por categoria.",
      posts,
      categoria,
      affiliates
    });
  } catch (err) {
    console.error("ERRO CATEGORIA:", err);
    return res.status(500).send("Erro do Servidor Interno");
  }
});
/*
==================================================
AFILIADOS - TRACKING
==================================================
*/

app.get("/out/:id", (req, res) => {
  try {
    const affiliate = registerAffiliateClick(req.params.id, {
      source: req.query.source || "site",
      page: req.get("referer") || "",
      userAgent: req.get("user-agent") || "",
      ip: req.ip || ""
    });

    if (!affiliate || !affiliate.url) {
      return res.redirect("/");
    }

    return res.redirect(affiliate.url);
  } catch (err) {
    console.error("ERRO AFILIADO:", err);
    return res.redirect("/");
  }
});
/*
==================================================
APIS
==================================================
*/

app.get("/api/posts", (req, res) => {
  try {
    const posts = safeArray(getAllPosts());

    return res.json({
      ok: true,
      data: posts
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

app.get("/api/indicadores", async (req, res) => {
  try {
    const data = await getEconomicData();
    const ai = analyzeFinancialScenario(data);

    return res.json({
      ok: true,
      data,
      ai
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

app.get("/api/affiliate-stats", (req, res) => {
  try {
    const secret = req.query.secret || req.headers["x-admin-secret"];

    if (secret !== process.env.PANEL_SECRET) {
      return res.status(401).json({
        ok: false,
        error: "Não autorizado"
      });
    }

    return res.json({
      ok: true,
      data: getAffiliateStats()
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});
/*
==================================================
SEO
==================================================
*/

app.get("/sitemap.xml", (req, res) => {
  try {
    const posts = safeArray(getAllPosts());

    const urls = posts.map((post) => {
      return `
        <url>
          <loc>${BASE_URL}/post/${post.slug}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.9</priority>
        </url>
      `;
    });

    res.header("Content-Type", "application/xml");

    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls.join("")}
      </urlset>
    `);
  } catch (err) {
    console.error("ERRO SITEMAP:", err);
    return res.status(500).send("Erro ao gerar sitemap.");
  }
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain");

  return res.send(`
User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
  `.trim());
});

/*
==================================================
HEALTH CHECK
==================================================
*/

app.get("/health", (req, res) => {
  return res.json({
    ok: true,
    app: APP_NAME,
    status: "online",
    time: new Date().toISOString(),
    autoPosts: process.env.AUTO_POSTS === "true",
    adsenseClient: Boolean(ADSENSE_CLIENT),
    adsenseSlot: Boolean(ADSENSE_SLOT),
    baseUrl: BASE_URL
  });
});

/*
==================================================
AUTO ENGINE
==================================================
*/

function bootAutoContentEngine() {
  if (global.__ENGINE_STARTED__) return;

  global.__ENGINE_STARTED__ = true;

  if (process.env.AUTO_POSTS !== "true") {
    console.log("🤖 Auto posts desligado");
    return;
  }

  if (typeof startContentEngine !== "function") {
    console.log("⚠️ contentEngine não disponível");
    return;
  }

  console.log("🔥 AUTO ENGINE ATIVO");

  startContentEngine({
    intervalMs: Number(process.env.AUTO_POST_INTERVAL_MS || 1800000),
    appName: APP_NAME,
    baseUrl: BASE_URL
  });
}

bootAutoContentEngine();

/*
==================================================
404
==================================================
*/

app.use((req, res) => {
  return res.status(404).send("Página não encontrada");
});

/*
==================================================
EXPORT
==================================================
*/

module.exports = app;
