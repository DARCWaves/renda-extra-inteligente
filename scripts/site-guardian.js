const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const ROOT = path.join(__dirname, "..");

function filePath(file) {
  return path.join(ROOT, file);
}

function exists(file) {
  return fs.existsSync(filePath(file));
}

function read(file, fallback = "") {
  try {
    return fs.readFileSync(filePath(file), "utf8");
  } catch {
    return fallback;
  }
}

function readJson(file, fallback) {
  try {
    const raw = read(file, "");
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function run(command) {
  try {
    childProcess.execSync(command, { cwd: ROOT, stdio: "pipe" });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: String(err.stderr || err.message || err)
    };
  }
}

function countRoute(code, route) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`app\\.get\\(["']${escaped}["']`, "g");
  return (code.match(regex) || []).length;
}

function validateXml(xml) {
  return (
    xml.trim().startsWith('<?xml version="1.0" encoding="UTF-8"?>') &&
    xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') &&
    !xml.toLowerCase().includes("<html") &&
    !xml.toLowerCase().includes("post?id") &&
    !xml.toLowerCase().includes("draft")
  );
}

function check() {
  const failures = [];
  const warnings = [];
  const passed = [];

  const appCode = read("app.js", "");

  if (!exists("app.js")) failures.push("app.js não existe.");
  else passed.push("app.js existe.");

  const syntaxApp = run("node -c app.js");
  if (!syntaxApp.ok) failures.push("app.js possui erro de sintaxe.");
  else passed.push("app.js sem erro de sintaxe.");

  if (appCode.includes("home.html")) failures.push("app.js ainda referencia home.html.");
  else passed.push("app.js não referencia home.html.");

  const sitemapRoutes = countRoute(appCode, "/sitemap.xml");
  if (sitemapRoutes !== 1) failures.push(`Quantidade inválida de rotas /sitemap.xml: ${sitemapRoutes}.`);
  else passed.push("Rota /sitemap.xml única.");

  const robotsRoutes = countRoute(appCode, "/robots.txt");
  if (robotsRoutes > 1) failures.push(`Rotas /robots.txt duplicadas: ${robotsRoutes}.`);
  else passed.push("Rota /robots.txt sem duplicação crítica.");

  if (appCode.includes("res.sendFile") && appCode.includes("views")) {
    warnings.push("Existe sendFile usando views. Verifique se não está servindo EJS como HTML.");
  } else {
    passed.push("Nenhum sendFile problemático em views detectado.");
  }

  const posts = readJson("data/posts.json", []);
  if (!Array.isArray(posts)) failures.push("data/posts.json não é um array.");
  else passed.push("data/posts.json válido.");

  const categoryCount = {};
  if (Array.isArray(posts)) {
    posts.forEach((post, index) => {
      if (!post.title) failures.push(`Post ${index} sem title.`);
      if (!post.slug) failures.push(`Post ${index} sem slug.`);
      if (!post.category) failures.push(`Post ${index} sem category.`);
      if (!post.description && !post.seoDescription) warnings.push(`Post ${index} sem description/seoDescription.`);
      if (!post.content) warnings.push(`Post ${index} sem content.`);

      const cat = String(post.category || "sem-categoria");
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    if (posts.length >= 6) {
      ["financas", "renda-extra", "programacao"].forEach((cat) => {
        if (!categoryCount[cat]) failures.push(`Categoria obrigatória sem conteúdo: ${cat}.`);
      });
    }
  }

  if (exists("services/seoSitemapService.js")) {
    const syntaxSeo = run("node -c services/seoSitemapService.js");
    if (!syntaxSeo.ok) failures.push("services/seoSitemapService.js possui erro de sintaxe.");
    else passed.push("seoSitemapService sem erro de sintaxe.");

    try {
      const { generateSitemapXml, generateRobotsTxt } = require(filePath("services/seoSitemapService.js"));
      const xml = generateSitemapXml();
      const robots = generateRobotsTxt();

      if (!validateXml(xml)) failures.push("Sitemap gerado não passou na validação XML.");
      else passed.push("Sitemap XML válido.");

      if (!robots.includes("Sitemap:") || !robots.includes("/sitemap.xml")) {
        failures.push("Robots gerado não aponta para sitemap.xml.");
      } else {
        passed.push("Robots aponta para sitemap.xml.");
      }
    } catch (err) {
      failures.push(`Erro ao gerar sitemap/robots: ${err.message}`);
    }
  } else {
    warnings.push("services/seoSitemapService.js não encontrado.");
  }

  if (!exists("public/ads.txt") && !appCode.includes('app.get("/ads.txt"')) {
    warnings.push("ads.txt não encontrado como arquivo nem rota detectada.");
  } else {
    passed.push("ads.txt detectado.");
  }

  ["views/home.ejs", "views/posts.ejs", "views/category.ejs", "views/post.ejs"].forEach((file) => {
    if (!exists(file)) failures.push(`${file} não existe.`);
    else passed.push(`${file} existe.`);
  });

  const report = {
    ok: failures.length === 0,
    passed,
    warnings,
    failures,
    categoryCount,
    checkedAt: new Date().toISOString()
  };

  fs.writeFileSync(filePath("data/guardian-report.json"), JSON.stringify(report, null, 2));

  return report;
}

if (require.main === module) {
  const report = check();

  console.log("\n========== SITE GUARDIAN ==========");
  console.log(`Status: ${report.ok ? "✅ APROVADO" : "❌ BLOQUEADO"}`);

  if (report.failures.length) {
    console.log("\nFalhas:");
    report.failures.forEach((item) => console.log("❌ " + item));
  }

  if (report.warnings.length) {
    console.log("\nAlertas:");
    report.warnings.forEach((item) => console.log("⚠️ " + item));
  }

  console.log("\nCategorias:");
  console.log(report.categoryCount);

  process.exit(report.ok ? 0 : 1);
}

module.exports = { check };
