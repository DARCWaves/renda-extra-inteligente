require("dotenv").config();

const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const axios = require("axios");

const {
  getAllPosts,
  getPostBySlug,
  getPostsByCategory,
  getLatestPosts
} = require("./services/postService");

const {
  getPillarBySlug
} = require("./services/pillarService");

const {
  getActiveAffiliate,
  getActiveAffiliates,
  getAffiliatesForContext,
  registerAffiliateClick,
  getAffiliateStats
} = require("./services/affiliateService");

const { analyticsMiddleware, trackEvent } = require("./services/analyticsService");

/*
==================================================
CONTENT ENGINE
==================================================
*/

const { startContentEngine } = require("./services/contentEngine");

const APP_NAME = "Renda Extra Inteligente";
const BASE_URL = process.env.BASE_URL || process.env.SITE_URL || "https://renda-extra-inteligente.onrender.com";
const ADSENSE_CLIENT = process.env.ADSENSE_CLIENT;
const ADSENSE_SLOT = process.env.ADSENSE_SLOT;

const app = express();

/*
==================================================
CONFIGURAÇÕES
==================================================
*/

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(analyticsMiddleware);

/*
==================================================
UTILS
==================================================
*/

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

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
    res.locals.adsenseClient = ADSENSE_CLIENT;
    res.locals.adsenseSlot = ADSENSE_SLOT;
    res.locals.affiliates = affiliates;
    res.locals.path = req.path;
    res.locals.title = null;
    res.locals.description = null;
    res.locals.ogImage = `${BASE_URL}/logo.png`;
    res.locals.canonical = `${BASE_URL}${req.path}`;
    
    // Injeta funções globais úteis nas views
    res.locals.formatDate = (date) => new Date(date).toLocaleDateString("pt-BR");
    
  } catch (err) {
    console.error("ERRO LOCALS:", err.message);
  }
  next();
});

/*
==================================================
ROTAS PRINCIPAIS
==================================================
*/

app.get("/", async (req, res) => {
  try {
    const posts = safeArray(getLatestPosts(6));
    const { getIndicators } = require("./services/indicatorService");
    const indicators = getIndicators();

    return res.render("home", {
      posts,
      indicators,
      title: "Renda Extra Inteligente | Aprenda a Lucrar com Estratégia",
      description: "Descubra formas reais de fazer renda extra, investir com inteligência e organizar sua vida financeira."
    });
  } catch (err) {
    console.error("ERRO HOME:", err);
    return res.status(500).send("Erro no servidor");
  }
});

app.get("/posts", async (req, res) => {
  try {
    const posts = safeArray(getAllPosts());

    return res.render("posts", {
      posts,
      title: "Todos os Conteúdos | " + APP_NAME,
      description: "Acesse nosso guia completo de conteúdos sobre finanças, renda extra e investimentos."
    });
  } catch (err) {
    console.error("ERRO POSTS:", err);
    return res.status(500).send("Erro ao carregar posts");
  }
});

app.get("/categoria/:slug", async (req, res) => {
  try {
    const categoria = req.params.slug;
    const posts = safeArray(getPostsByCategory(categoria));
    
    const categoryInfo = {
      "financas": { title: "Finanças Pessoais", headline: "Domine seu dinheiro", description: "Aprenda a organizar suas contas e fazer o salário render mais." },
      "renda-extra": { title: "Renda Extra", headline: "Novas fontes de lucro", description: "Estratégias reais para ganhar dinheiro extra no tempo livre." },
      "investimentos": { title: "Investimentos", headline: "Cresça seu patrimônio", description: "Guia para iniciantes e avançados no mundo dos investimentos." },
      "programacao": { title: "Programação", headline: "Tecnologia e Lucro", description: "Aprenda a programar e monetize suas habilidades digitais." },
      "economia": { title: "Economia", headline: "Entenda o Cenário", description: "O impacto dos indicadores econômicos no seu dia a dia." },
      "trabalho": { title: "Trabalho", headline: "Carreira e Eficiência", description: "Como valorizar seu tempo e crescer profissionalmente." }
    };

    const info = categoryInfo[categoria] || { title: categoria, headline: "Conteúdos", description: "Explore nossos artigos." };

    return res.render("category", {
      categoria,
      posts,
      info,
      title: info.title + " | " + APP_NAME,
      description: info.description
    });
  } catch (err) {
    console.error("ERRO CATEGORIA:", err);
    return res.status(500).send("Erro ao carregar categoria");
  }
});

app.get("/post/:slug", async (req, res) => {
  try {
    const post = getPostBySlug(req.params.slug);

    if (!post) {
      return res.status(404).send("Post não encontrado");
    }

    const context = [
      post.title,
      post.description,
      post.category,
      post.content,
      "finanças renda extra investimentos economia dinheiro"
    ].join(" ");

    const affiliates = safeArray(getAffiliatesForContext(context, 8));
    const relatedPosts = typeof require("./services/postService").getRelatedPosts === "function" 
      ? require("./services/postService").getRelatedPosts(post.slug, post.category, 3)
      : [];

    return res.render("post", {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.description,
      post,
      affiliates,
      relatedPosts,
      adsenseClient: ADSENSE_CLIENT,
      adsenseSlot: ADSENSE_SLOT
    });
  } catch (err) {
    console.error("ERRO POST:", err);
    return res.status(500).send("Erro ao carregar o conteúdo");
  }
});

app.get("/indicadores", (req, res) => {
  const { getIndicators } = require("./services/indicatorService");
  const indicators = getIndicators();
  res.render("indicadores", {
    indicators,
    title: "Indicadores Econômicos em Tempo Real | " + APP_NAME,
    description: "Acompanhe o Dólar, Selic, IPCA e outros dados que afetam seu bolso hoje."
  });
});

app.get("/ofertas", (req, res) => {
  const affiliates = safeArray(getActiveAffiliates(20));
  res.render("ofertas", {
    affiliates,
    title: "Melhores Ofertas e Ferramentas | " + APP_NAME,
    description: "Seleção de produtos e serviços recomendados para sua evolução financeira."
  });
});

/*
==================================================
PÁGINAS INSTITUCIONAIS (EEAT)
==================================================
*/

app.get("/sobre", (req, res) => {
  res.render("static/about", {
    title: "Sobre | " + APP_NAME,
    description: "Conheça a missão e os valores do Renda Extra Inteligente."
  });
});

app.get("/contato", (req, res) => {
  res.render("static/contact", {
    title: "Contato | " + APP_NAME,
    description: "Entre em contato com a equipe do Renda Extra Inteligente."
  });
});

app.get("/privacidade", (req, res) => {
  res.render("static/privacy", {
    title: "Política de Privacidade | " + APP_NAME,
    description: "Saiba como protegemos seus dados e sua privacidade."
  });
});

app.get("/termos", (req, res) => {
  res.render("static/terms", {
    title: "Termos de Uso | " + APP_NAME,
    description: "Regras e termos para utilização do nosso portal."
  });
});

app.get("/editorial", (req, res) => {
  res.render("static/editorial", {
    title: "Política Editorial | " + APP_NAME,
    description: "Como garantimos a qualidade e precisão do nosso conteúdo."
  });
});

app.get("/transparencia", (req, res) => {
  res.render("static/affiliate-disclosure", {
    title: "Divulgação de Afiliados | " + APP_NAME,
    description: "Transparência sobre nossa forma de monetização e parcerias."
  });
});

/*
==================================================
PÁGINAS PILAR (AUTHORITY HUBS)
==================================================
*/

app.get("/guia/:slug", async (req, res) => {
  try {
    const pillar = getPillarBySlug(req.params.slug);

    if (!pillar) {
      return res.status(404).send("Guia não encontrado");
    }

    const context = [
      pillar.title,
      pillar.description,
      "guia mestre autoridade completa",
      pillar.category || ""
    ].join(" ");

    const affiliates = safeArray(getAffiliatesForContext(context, 8));

    return res.render("pillar", {
      title: pillar.seoTitle || pillar.title,
      description: pillar.seoDescription || pillar.description,
      pillar,
      affiliates,
      adsenseClient: ADSENSE_CLIENT,
      adsenseSlot: ADSENSE_SLOT
    });
  } catch (err) {
    console.error("ERRO PILAR:", err);
    return res.status(500).send("Erro ao carregar o guia mestre.");
  }
});

/*
==================================================
AFILIADOS - TRACKING
==================================================
*/

app.get("/out/:id", (req, res) => {
  try {
    const id = req.params.id;
    const affiliates = safeArray(getActiveAffiliates(100));
    const item = affiliates.find((a) => a.id === id);

    if (!item) return res.redirect("/");

    registerAffiliateClick(id, {
      referer: req.get("Referer"),
      ua: req.get("User-Agent")
    });

    return res.redirect(item.url);
  } catch (err) {
    return res.redirect("/");
  }
});

/*
==================================================
API
==================================================
*/

const apiRoutes = require("./routes/api");
app.use("/api", apiRoutes);

app.post("/api/analytics/event", (req, res) => {
  try {
    const { type, id } = req.body;
    trackEvent(type, id);
    return res.status(204).end();
  } catch {
    return res.status(500).end();
  }
});

app.get("/ads.txt", (req, res) => {
  return res.send("google.com, pub-2679191515040105, DIRECT, f08c47fec0942fa0\n");
});

/*
==================================================
SEO TÉCNICO
==================================================
*/

const { generateSitemapXml, generateRobotsTxt } = require("./services/seoSitemapService");

app.get("/sitemap.xml", (req, res) => {
  try {
    const xml = generateSitemapXml();
    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    res.status(500).end();
  }
});

app.get("/robots.txt", (req, res) => {
  try {
    const robots = generateRobotsTxt();
    res.header("Content-Type", "text/plain");
    res.send(robots);
  } catch (err) {
    res.status(500).end();
  }
});

/*
==================================================
AUTO ENGINE
==================================================
*/

function bootAutoContentEngine() {
  if (global.__ENGINE_STARTED__) return;
  global.__ENGINE_STARTED__ = true;

  if (process.env.AUTO_POSTS !== "true") return;

  startContentEngine({
    intervalMs: Number(process.env.AUTO_POST_INTERVAL_MS || 1800000),
    appName: APP_NAME,
    baseUrl: BASE_URL
  });
}

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

module.exports = { app, bootAutoContentEngine };
