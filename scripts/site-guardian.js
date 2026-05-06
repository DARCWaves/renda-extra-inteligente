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

  /*
  ==================================================
  SISTEMA E INFRAESTRUTURA
  ==================================================
  */

  if (!exists("app.js")) failures.push("app.js não existe.");
  else passed.push("app.js existe.");

  const syntaxApp = run("node -c app.js");
  if (!syntaxApp.ok) failures.push("app.js possui erro de sintaxe.");
  else passed.push("app.js sem erro de sintaxe.");

  const syncIoRegex = /fs\.read|fs\.write|fs\.exists/g;
  if ((appCode.match(syncIoRegex) || []).length > 2) {
    warnings.push("app.js usa muitas operações de IO síncronas diretamente. Considere usar StorageAdapter.");
  }

  /*
  ==================================================
  PÁGINAS DE CONFIANÇA (EEAT / ADSENSE)
  ==================================================
  */

  const trustRoutes = ["/sobre", "/contato", "/privacidade", "/termos", "/editorial", "/transparencia"];
  trustRoutes.forEach(route => {
    if (countRoute(appCode, route) === 0) {
      failures.push(`Página de confiança obrigatória ausente em app.js: ${route}`);
    } else {
      passed.push(`Rota de confiança detectada: ${route}`);
    }
  });

  const sitemapRoutes = countRoute(appCode, "/sitemap.xml");
  if (sitemapRoutes !== 1) failures.push(`Quantidade inválida de rotas /sitemap.xml: ${sitemapRoutes}.`);
  else passed.push("Rota /sitemap.xml única.");

  /*
  ==================================================
  INTEGRIDADE DE DADOS (POSTS)
  ==================================================
  */

  const postsPath = filePath("data/posts.json");
  if (exists("data/posts.json")) {
    const stats = fs.statSync(postsPath);
    const sizeMb = stats.size / (1024 * 1024);
    if (sizeMb > 1.5) {
      warnings.push(`posts.json está ficando grande (${sizeMb.toFixed(2)} MB). Considere migrar para DB.`);
    }
  }

  const posts = readJson("data/posts.json", []);
  if (!Array.isArray(posts)) failures.push("data/posts.json não é um array.");
  else passed.push("data/posts.json válido.");

  const categoryCount = {};
  const slugs = new Set();
  const OFFICIAL_CATEGORIES = ["financas", "renda-extra", "programacao", "investimentos", "economia", "trabalho"];

  if (Array.isArray(posts)) {
    posts.forEach((post, index) => {
      const id = post.slug || `index ${index}`;
      
      // Validação de estrutura
      if (!post.title) failures.push(`Post [${id}] sem title.`);
      if (!post.slug) failures.push(`Post [${id}] sem slug.`);
      else {
        if (slugs.has(post.slug)) failures.push(`Slug duplicado detectado: ${post.slug}`);
        slugs.add(post.slug);
      }

      if (!post.category) failures.push(`Post [${id}] sem category.`);
      else if (!OFFICIAL_CATEGORIES.includes(post.category)) {
        warnings.push(`Post [${id}] usa categoria não oficial: ${post.category}`);
      }

      if (!post.description && !post.seoDescription) {
        warnings.push(`Post [${id}] sem meta descrição (SEO).`);
      }

      const cat = String(post.category || "sem-categoria");
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    // Verificação de categorias críticas
    if (posts.length >= 10) {
      OFFICIAL_CATEGORIES.forEach((cat) => {
        if (!categoryCount[cat]) failures.push(`Categoria oficial sem conteúdo: ${cat}.`);
      });
    }
  }

  /*
  ==================================================
  INTEGRIDADE DE DADOS (AFILIADOS)
  ==================================================
  */

  const affiliates = readJson("data/affiliates.json", []);
  if (!Array.isArray(affiliates)) warnings.push("data/affiliates.json não é um array ou está ausente.");
  else {
    affiliates.forEach((aff, idx) => {
      if (!aff.id || !aff.url) warnings.push(`Afiliado índice ${idx} malformado.`);
    });
    passed.push("Base de afiliados validada.");
  }

  /*
  ==================================================
  SEO E RENDERING
  ==================================================
  */

  if (exists("services/seoSitemapService.js")) {
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
