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
  registerAffiliateClick
} = require("./services/affiliateService");

const { generateAutoPost } = require("./services/autoPostService");

/*
==================================================
APP
==================================================
*/

const app = express();

const APP_NAME = "Renda Extra Inteligente";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADSENSE_CLIENT = process.env.ADSENSE_CLIENT || "";
const ADSENSE_SLOT = process.env.ADSENSE_SLOT || "";

/*
==================================================
HELPERS
==================================================
*/

function normalizeIndicators(indicators, economicData) {
  if (indicators && Array.isArray(indicators.resumo)) {
    return indicators;
  }

  return {
    ...(indicators || {}),
    resumo: [
      {
        nome: "Dólar",
        valor: economicData?.dolar || indicators?.dolar || "Carregando...",
        slug: "dolar"
      },
      {
        nome: "Taxa Selic",
        valor: economicData?.selic || indicators?.selic || "Carregando...",
        slug: "selic"
      },
      {
        nome: "Inflação oficial",
        valor: economicData?.inflacao || indicators?.inflacao || "Carregando...",
        slug: "inflacao"
      },
      {
        nome: "Índice do Bolso Popular",
        valor: economicData?.bolsoPopular || indicators?.bolsoPopular || "Carregando...",
        slug: "bolso-popular"
      },
      {
        nome: "Salário mínimo",
        valor: economicData?.salarioMinimo || indicators?.salarioMinimo || "Carregando...",
        slug: "salario-minimo"
      },
      {
        nome: "Arrecadação de tributos",
        valor: economicData?.arrecadacao || indicators?.arrecadacao || "Carregando...",
        slug: "tributos"
      }
    ],
    iaFinanceira: indicators?.iaFinanceira || null,
    detalhes: indicators?.detalhes || {}
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
  try {
    const posts = getLatestPosts(6);
    const economicData = await getEconomicData();
    const rawIndicators = await getIndicators();
    const indicators = normalizeIndicators(rawIndicators, economicData);

    const affiliates = getAffiliatesForContext(
      "home finanças renda extra investimentos economia controle financeiro dinheiro",
      8
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
    return res.status(500).send(`<pre>${err.stack}</pre>`);
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

    const affiliates = getAffiliatesForContext(
      "indicadores economia inflação selic dólar salário mínimo tributos bolso popular",
      8
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
    return res.status(500).send(`<pre>${err.stack}</pre>`);
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

    const indicador =
      indicators.detalhes?.[req.params.slug] ||
      null;

    if (!indicador) {
      return res.status(404).send("Indicador não encontrado");
    }

    const context = `
      ${indicador.titulo || ""}
      ${indicador.descricao || ""}
      ${indicador.explicacao || ""}
      ${indicador.slug || ""}
      finanças economia renda extra investimentos dinheiro
    `;

    const affiliates = getAffiliatesForContext(context, 8);

    return res.render("indicator", {
      title: indicador.seoTitle || indicador.titulo,
      description: indicador.seoDescription || indicador.explicacao,
      indicador,
      iaFinanceira: indicators.iaFinanceira,
      affiliates
    });
  } catch (err) {
    console.error("ERRO INDICADOR:", err);
    return res.status(500).send(`<pre>${err.stack}</pre>`);
  }
});

/*
==================================================
POSTS
==================================================
*/

app.get("/posts", (req, res) => {
  try {
    const posts = getAllPosts();

    const affiliates = getAffiliatesForContext(
      "conteúdos finanças renda extra investimentos educação financeira dinheiro",
      8
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
    return res.status(500).send(`<pre>${err.stack}</pre>`);
  }
});

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

    const affiliates = getAffiliatesForContext(context, 8);

    return res.render("post", {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.description,
      post,
      affiliates
    });
  } catch (err) {
    console.error("ERRO POST:", err);
    return res.status(500).send(`<pre>${err.stack}</pre>`);
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
    const posts = getPostsByCategory(categoria);

    const affiliates = getAffiliatesForContext(
      `${categoria} finanças renda extra investimentos economia dinheiro`,
      8
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
    return res.status(500).send(`<pre>${err.stack}</pre>`);
  }
});

/*
==================================================
AFILIADOS
==================================================
*/

app.get("/out/:id", (req, res) => {
  try {
    const affiliate = registerAffiliateClick(req.params.id);

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
ADMIN
==================================================
*/

app.post("/admin/generate-post", (req, res) => {
  try {
    const secret = req.headers["x-admin-secret"] || req.body.secret;

    if (secret !== process.env.PANEL_SECRET) {
      return res.status(401).json({
        ok: false,
        error: "Não autorizado"
      });
    }

    const post = generateAutoPost(req.body.topic || "finanças pessoais");

    return res.json({
      ok: true,
      post
    });
  } catch (err) {
    console.error("ERRO GERAR POST:", err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/*
==================================================
API
==================================================
*/

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

app.get("/api/indicadores-completos", async (req, res) => {
  try {
    const economicData = await getEconomicData();
    const rawIndicators = await getIndicators();
    const indicators = normalizeIndicators(rawIndicators, economicData);

    return res.json({
      ok: true,
      data: indicators
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

app.get("/api/posts", (req, res) => {
  try {
    return res.json({
      ok: true,
      data: getAllPosts()
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
    const posts = getAllPosts();

    const staticUrls = [
      "/",
      "/indicadores",
      "/posts",
      "/categoria/financas",
      "/categoria/investimentos",
      "/categoria/renda-extra",
      "/categoria/economia",
      "/indicador/dolar",
      "/indicador/selic",
      "/indicador/inflacao",
      "/indicador/bolso-popular",
      "/indicador/salario-minimo",
      "/indicador/tributos"
    ];

    const staticXml = staticUrls
      .map((url) => {
        return `
          <url>
            <loc>${BASE_URL}${url}</loc>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
          </url>
        `;
      })
      .join("");

    const postsXml = posts
      .map((post) => {
        return `
          <url>
            <loc>${BASE_URL}/post/${post.slug}</loc>
            <changefreq>weekly</changefreq>
            <priority>0.9</priority>
          </url>
        `;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${staticXml}
        ${postsXml}
      </urlset>
    `;

    res.header("Content-Type", "application/xml");
    return res.send(xml);
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
HEALTH
==================================================
*/

app.get("/health", (req, res) => {
  return res.json({
    ok: true,
    app: APP_NAME,
    status: "online",
    time: new Date().toISOString()
  });
});

/*
==================================================
404
==================================================
*/

app.use((req, res) => {
  return res.status(404).send(`
    <h1>404 - Página não encontrada</h1>
    <p>Essa rota não existe.</p>
    <a href="/">Voltar</a>
  `);
});

/*
==================================================
EXPORT
==================================================
*/

module.exports = app;
