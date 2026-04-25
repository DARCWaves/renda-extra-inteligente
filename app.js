require("dotenv").config();

const express = require("express");
const path = require("path");

const {
  getEconomicData
} = require("./services/economicService");

const {
  getIndicators
} = require("./services/indicatorService");

const {
  registerAffiliateClick,
  getAffiliateStats
} = require("./services/affiliateService");

const app = express();

const PORT = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(async (req, res, next) => {
  try {
    const economicData = await getEconomicData();
    res.locals.economic = economicData;
  } catch (err) {
    console.log("Erro economicData:", err.message);
    res.locals.economic = {};
  }

  next();
});
app.get("/", async (req, res) => {
  try {
    const indicadores = await getIndicators();

    res.render("home", {
      indicadores
    });
  } catch (err) {
    console.log(err);
    res.send("Erro ao carregar home");
  }
});
app.get("/indicadores", async (req, res) => {
  try {
    const indicadores = await getIndicators();

    res.render("indicadores", {
      indicadores
    });
  } catch (err) {
    console.log(err);
    res.send("Erro ao carregar indicadores");
  }
});
app.get("/indicador/:slug", async (req, res) => {
  try {
    const indicadores = await getIndicators();

    const indicador = indicadores.find(
      i => i.slug === req.params.slug
    );

    if (!indicador) {
      return res.send("Indicador não encontrado");
    }

    res.render("indicator", {
      indicador
    });

  } catch (err) {
    console.log(err);
    res.send("Erro ao carregar indicador");
  }
});
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
    console.log("Erro tracking:", err);
    return res.redirect("/");
  }
});
app.get("/api/affiliate-stats", (req, res) => {
  try {
    const secret = req.query.secret;

    if (secret !== process.env.PANEL_SECRET) {
      return res.status(401).json({
        error: "Não autorizado"
      });
    }

    return res.json(getAffiliateStats());

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/ping", (req, res) => {
  res.send("Servidor ativo 🚀");
});
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});
app.use((req, res) => {
  res.status(404).send("Página não encontrada");
});
app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});
