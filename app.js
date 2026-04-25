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
  startContentEngine = require("./services/contentEngine").startContentEngine;
} catch {
  console.log("⚠️ contentEngine não carregado");
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

function normalizeIndicators(indicators, economicData) {
  if (indicators && Array.isArray(indicators.resumo)) return indicators;

  return {
    resumo: [
      { nome: "Dólar", valor: economicData?.dolar, periodo: economicData?.periodos?.dolar, slug: "dolar" },
      { nome: "Selic", valor: economicData?.selic, periodo: economicData?.periodos?.selic, slug: "selic" },
      { nome: "Inflação", valor: economicData?.inflacao, periodo: economicData?.periodos?.inflacao, slug: "inflacao" },
      { nome: "Bolso Popular", valor: economicData?.bolsoPopular, periodo: economicData?.periodos?.bolsoPopular, slug: "bolso-popular" },
      { nome: "Salário Mínimo", valor: economicData?.salarioMinimo, periodo: economicData?.periodos?.salarioMinimo, slug: "salario-minimo" },
      { nome: "Tributos", valor: economicData?.arrecadacao, periodo: economicData?.periodos?.arrecadacao, slug: "tributos" }
    ],
    detalhes: indicators?.detalhes || {},
    iaFinanceira: indicators?.iaFinanceira || null
  };
}

/*
==================================================
MIDDLEWARE
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
  res.locals.appName = APP_NAME;
  res.locals.baseUrl = BASE_URL;

  res.locals.adsenseClient = ADSENSE_CLIENT;
  res.locals.adsenseSlot = ADSENSE_SLOT;

  res.locals.affiliates = getActiveAffiliates();
  res.locals.affiliate = getActiveAffiliate();

  next();
});

/*
==================================================
HOME
==================================================
*/

app.get("/", async (req, res) => {
  const data = await getEconomicData();
  const raw = await getIndicators();
  const indicators = normalizeIndicators(raw, data);

  res.render("home", {
    title: APP_NAME,
    data,
    indicators,
    posts: getLatestPosts(6),
    affiliates: getAffiliatesForContext("finanças renda dinheiro", 8)
  });
});

/*
==================================================
INDICADORES
==================================================
*/

app.get("/indicadores", async (req, res) => {
  const data = await getEconomicData();
  const ai = analyzeFinancialScenario(data);
  const raw = await getIndicators();
  const indicators = normalizeIndicators(raw, data);

  res.render("indicadores", {
    title: "Indicadores",
    data,
    ai,
    indicators
  });
});

/*
==================================================
INDICADOR
==================================================
*/

app.get("/indicador/:slug", async (req, res) => {
  const data = await getEconomicData();
  const raw = await getIndicators();
  const indicators = normalizeIndicators(raw, data);

  const indicador = indicators.detalhes[req.params.slug];

  if (!indicador) return res.status(404).send("Não encontrado");

  res.render("indicator", {
    indicador,
    iaFinanceira: indicators.iaFinanceira,
    adsenseClient: ADSENSE_CLIENT,
    adsenseSlot: ADSENSE_SLOT,
    affiliates: getAffiliatesForContext(indicador.titulo)
  });
});

/*
==================================================
POSTS
==================================================
*/

app.get("/posts", (req, res) => {
  res.render("posts", {
    posts: getAllPosts()
  });
});

app.get("/post/:slug", (req, res) => {
  const post = getPostBySlug(req.params.slug);

  if (!post) return res.status(404).send("Post não encontrado");

  res.render("post", {
    post,
    adsenseClient: ADSENSE_CLIENT,
    adsenseSlot: ADSENSE_SLOT,
    affiliates: getAffiliatesForContext(post.title)
  });
});

/*
==================================================
CATEGORIAS
==================================================
*/

app.get("/categoria/:cat", (req, res) => {
  res.render("category", {
    posts: getPostsByCategory(req.params.cat),
    categoria: req.params.cat
  });
});

/*
==================================================
TRACKING AFILIADO
==================================================
*/

app.get("/out/:id", (req, res) => {
  const affiliate = registerAffiliateClick(req.params.id);

  if (!affiliate) return res.redirect("/");

  res.redirect(affiliate.url);
});

/*
==================================================
APIS
==================================================
*/

app.get("/api/indicadores", async (req, res) => {
  const data = await getEconomicData();
  const ai = analyzeFinancialScenario(data);

  res.json({ data, ai });
});

app.get("/api/posts", (req, res) => {
  res.json(getAllPosts());
});

app.get("/api/affiliate-stats", (req, res) => {
  if (req.query.secret !== process.env.PANEL_SECRET) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  res.json(getAffiliateStats());
});

/*
==================================================
SEO
==================================================
*/

app.get("/sitemap.xml", (req, res) => {
  const posts = getAllPosts();

  res.header("Content-Type", "application/xml");

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${posts.map(p => `<url><loc>${BASE_URL}/post/${p.slug}</loc></url>`).join("")}
  </urlset>`);
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain");

  res.send(`User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml`);
});

/*
==================================================
AUTO ENGINE
==================================================
*/

if (process.env.AUTO_POSTS === "true" && startContentEngine) {
  console.log("🔥 AUTO ENGINE ATIVO");

  startContentEngine({
    intervalMs: Number(process.env.AUTO_POST_INTERVAL_MS || 1800000)
  });
}

/*
==================================================
FINAL
==================================================
*/

app.use((req, res) => {
  res.status(404).send("Página não encontrada");
});

module.exports = app;
